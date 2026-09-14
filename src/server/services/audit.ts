import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';

interface AuditParams {
  action: string;
  userId?: string;
  usernameSnapshot?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  sourceIp?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  errorCode?: string;
}

export async function auditAction(params: AuditParams): Promise<void> {
  try {
    // Sanitize metadata - never store sensitive fields
    const safeMetadata = params.metadata
      ? sanitizeMetadata(params.metadata)
      : undefined;

    await db.insert(schema.auditLogs).values({
      action: params.action,
      userId: params.userId,
      usernameSnapshot: params.usernameSnapshot,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      success: params.success ?? true,
      sourceIp: params.sourceIp,
      userAgent: params.userAgent ? params.userAgent.slice(0, 512) : undefined,
      metadata: safeMetadata ? JSON.stringify(safeMetadata) : undefined,
      errorCode: params.errorCode,
    });
  } catch (error) {
    // Never let audit logging failure break the main flow
    console.error('[AUDIT] Failed to record audit log:', error);
  }
}

// Fields that must never be stored in audit metadata
const SENSITIVE_FIELDS = new Set([
  'password', 'passwordHash', 'token', 'secret', 'credential',
  'authToken', 'accessToken', 'refreshToken', 'apiKey', 'privateKey',
  'snmpCommunity', 'authPassphrase', 'privPassphrase',
]);

function sanitizeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) continue;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function recordSystemEvent(params: {
  event: string;
  deviceId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}): Promise<void> {
  try {
    await db.insert(schema.systemEvents).values({
      event: params.event,
      deviceId: params.deviceId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: params.metadata ? JSON.stringify(sanitizeMetadata(params.metadata)) : undefined,
      severity: params.severity ?? 'INFO',
    });
  } catch (error) {
    console.error('[EVENTS] Failed to record system event:', error);
  }
}
