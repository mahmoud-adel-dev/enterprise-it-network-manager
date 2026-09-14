import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

export interface NotificationItem {
  id: string;
  type: string;
  category: 'ALL' | 'ALERTS' | 'SYSTEM';
  title: string;
  description: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  href?: string | null;
  read: boolean;
  readAt?: Date | null;
  dismissed: boolean;
  createdAt: Date;
  metadata?: string | null;
}

/**
 * Validates that an href is strictly an internal application path.
 * Rejects protocol-relative URLs (//), javascript:, data:, and external domains.
 */
export function sanitizeInternalHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  // Must start with exactly one slash, followed by an alphanumeric character, hyphen, or underscore
  if (/^\/[a-zA-Z0-9_\-][a-zA-Z0-9_\-\/\?&=#\.]*$/.test(trimmed) && !trimmed.startsWith('//')) {
    return trimmed;
  }
  return null;
}

/**
 * Sync real system events and device states into the notifications table.
 * Fully namespaced deduplication: `${sourceType}:${eventId}:${userId || 'system'}`
 * Prevents cross-table ID collisions and ensures user-scoped persistence.
 */
export async function syncSystemNotifications(userId?: string): Promise<void> {
  const userScope = userId || 'system';

  try {
    // 1. Sync recent system events (Source: SYSTEM_EVENT)
    const events = await db
      .select()
      .from(schema.systemEvents)
      .orderBy(desc(schema.systemEvents.timestamp))
      .limit(15);

    for (const ev of events) {
      const sourceId = `SYSTEM_EVENT:${ev.id}:${userScope}`;
      const existing = await db
        .select({ id: schema.notifications.id })
        .from(schema.notifications)
        .where(eq(schema.notifications.sourceEventId, sourceId))
        .limit(1);

      if (existing.length === 0) {
        let title = 'System Event';
        let descText = `Event ${ev.event} occurred.`;
        let severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO';
        let href: string | null = '/audit';
        const category: 'ALERTS' | 'SYSTEM' = ev.severity === 'ERROR' || ev.severity === 'WARN' ? 'ALERTS' : 'SYSTEM';

        if (ev.severity === 'ERROR') severity = 'ERROR';
        else if (ev.severity === 'WARN') severity = 'WARNING';

        if (ev.event === 'DISCOVERY_COMPLETED') {
          title = 'Network Discovery Completed';
          try {
            const meta = ev.metadata ? JSON.parse(ev.metadata) : {};
            descText = `Discovered ${meta.hostsResponded ?? 0} hosts across configured subnets.`;
          } catch {
            descText = 'Network scan completed successfully.';
          }
          severity = 'SUCCESS';
          href = '/network/discovery';
        }

        await db.insert(schema.notifications).values({
          userId: userId ?? null,
          type: 'DISCOVERY',
          category,
          title,
          description: descText,
          severity,
          href: sanitizeInternalHref(href),
          sourceEventId: sourceId,
          metadata: ev.metadata,
          createdAt: ev.timestamp,
        });
      }
    }

    // 2. Check pending device approvals (Source: DEVICE_PENDING)
    const pendingDevices = await db
      .select({ id: schema.devices.id, hostname: schema.devices.hostname, ip: schema.devices.ipAddress })
      .from(schema.devices)
      .where(eq(schema.devices.approvalStatus, 'PENDING'))
      .limit(5);

    if (pendingDevices.length > 0) {
      const sourceId = `DEVICE_PENDING:${pendingDevices[0]?.id}:${userScope}`;
      const existing = await db
        .select({ id: schema.notifications.id })
        .from(schema.notifications)
        .where(eq(schema.notifications.sourceEventId, sourceId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.notifications).values({
          userId: userId ?? null,
          type: 'DEVICE',
          category: 'ALERTS',
          title: 'Devices Awaiting Approval',
          description: `${pendingDevices.length} new endpoint(s) require administrator authorization to enroll.`,
          severity: 'WARNING',
          href: '/devices/pending',
          sourceEventId: sourceId,
        });
      }
    }

    // 3. Sync recent critical audit logs (Source: AUDIT_LOG)
    const recentAudit = await db
      .select()
      .from(schema.auditLogs)
      .where(
        inArray(schema.auditLogs.action, [
          'DEVICE_APPROVED',
          'DEVICE_REJECTED',
          'SETTINGS_UPDATED',
          'TOKEN_CREATED',
          'USER_CREATED',
        ]),
      )
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(10);

    for (const log of recentAudit) {
      const sourceId = `AUDIT_LOG:${log.id}:${userScope}`;
      const existing = await db
        .select({ id: schema.notifications.id })
        .from(schema.notifications)
        .where(eq(schema.notifications.sourceEventId, sourceId))
        .limit(1);

      if (existing.length === 0) {
        let title = 'Administrative Activity';
        let descText = `Action ${log.action} performed by ${log.usernameSnapshot || 'administrator'}.`;
        let severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO';
        let href: string | null = '/audit';

        if (log.action === 'DEVICE_APPROVED') {
          title = 'Endpoint Approved';
          descText = `Device was approved by ${log.usernameSnapshot || 'admin'} and enrolled.`;
          severity = 'SUCCESS';
          href = '/devices';
        } else if (log.action === 'DEVICE_REJECTED') {
          title = 'Endpoint Rejected';
          descText = `Enrollment request was denied by ${log.usernameSnapshot || 'admin'}.`;
          severity = 'WARNING';
          href = '/devices';
        } else if (log.action === 'SETTINGS_UPDATED') {
          title = 'System Configuration Updated';
          descText = `Core platform parameters updated.`;
          severity = 'INFO';
          href = '/admin/settings';
        } else if (log.action === 'TOKEN_CREATED') {
          title = 'New Enrollment Token Generated';
          descText = `Agent pre-shared key created for deployment.`;
          severity = 'INFO';
          href = '/admin/settings';
        }

        await db.insert(schema.notifications).values({
          userId: userId ?? null,
          type: 'SECURITY',
          category: 'SYSTEM',
          title,
          description: descText,
          severity,
          href: sanitizeInternalHref(href),
          sourceEventId: sourceId,
          createdAt: log.timestamp,
        });
      }
    }
  } catch (err) {
    console.error('[notifications] Failed to sync system notifications:', err);
  }
}

export async function getNotifications(params: {
  userId: string;
  category?: 'ALL' | 'ALERTS' | 'SYSTEM';
  limit?: number;
}): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  // Sync latest system events scoped to this authenticated user
  await syncSystemNotifications(params.userId);

  const limit = params.limit ?? 25;
  const conditions = [
    eq(schema.notifications.dismissed, false),
    eq(schema.notifications.userId, params.userId),
  ];

  if (params.category && params.category !== 'ALL') {
    conditions.push(eq(schema.notifications.category, params.category));
  }

  const items = await db
    .select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);

  const [unreadResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, params.userId),
        eq(schema.notifications.dismissed, false),
        eq(schema.notifications.read, false),
      ),
    );

  const unreadCount = Number(unreadResult?.count ?? 0);

  return {
    notifications: items.map((item) => ({
      id: item.id,
      type: item.type,
      category: (item.category as 'ALL' | 'ALERTS' | 'SYSTEM') || 'SYSTEM',
      title: item.title,
      description: item.description,
      severity: (item.severity as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR') || 'INFO',
      href: sanitizeInternalHref(item.href),
      read: item.read,
      readAt: item.readAt,
      dismissed: item.dismissed,
      createdAt: item.createdAt,
      metadata: item.metadata,
    })),
    unreadCount,
  };
}

/**
 * Marks single notification as read, strictly scoped to userId to prevent IDOR.
 */
export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId),
      ),
    );

  return (result.changes ?? 0) > 0;
}

/**
 * Marks all notifications for a specific user as read.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.dismissed, false),
        eq(schema.notifications.read, false),
      ),
    );

  return (result.changes ?? 0) > 0;
}

/**
 * Dismisses a single notification, strictly scoped to userId to prevent IDOR.
 */
export async function dismissNotification(id: string, userId: string): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({
      dismissed: true,
      dismissedAt: new Date(),
    })
    .where(
      and(
        eq(schema.notifications.id, id),
        eq(schema.notifications.userId, userId),
      ),
    );

  return (result.changes ?? 0) > 0;
}

/**
 * Clears all notifications exclusively for the authenticated user.
 */
export async function clearAllNotifications(userId: string): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({
      dismissed: true,
      dismissedAt: new Date(),
    })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.dismissed, false),
      ),
    );

  return (result.changes ?? 0) > 0;
}
