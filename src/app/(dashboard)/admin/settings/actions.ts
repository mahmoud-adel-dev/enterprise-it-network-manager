'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface SettingsResponse {
  success: boolean;
  error?: string;
  generatedToken?: string;
}

export async function saveSettingsAction(formData: FormData): Promise<SettingsResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const settingsEntries = [
    { key: 'system.session_expiry_days', value: (formData.get('sessionExpiryDays') as string)?.trim() || '7', desc: 'Session expiration duration in days' },
    { key: 'agent.heartbeat_interval_seconds', value: (formData.get('heartbeatInterval') as string)?.trim() || '60', desc: 'Agent polling and heartbeat frequency in seconds' },
    { key: 'storage.package_path', value: (formData.get('packagePath') as string)?.trim() || './data/packages', desc: 'Server filesystem storage root for software installers' },
    { key: 'security.max_failed_logins', value: (formData.get('maxFailedLogins') as string)?.trim() || '5', desc: 'Failed login attempts before account lockout' },
    { key: 'security.lockout_minutes', value: (formData.get('lockoutMinutes') as string)?.trim() || '15', desc: 'Account lockout duration in minutes' },
  ];

  try {
    for (const s of settingsEntries) {
      const existing = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, s.key)).get();
      if (existing) {
        await db.update(schema.appSettings).set({
          value: s.value,
          description: s.desc,
          updatedAt: new Date(),
          updatedBy: session.userId,
        }).where(eq(schema.appSettings.key, s.key));
      } else {
        await db.insert(schema.appSettings).values({
          key: s.key,
          value: s.value,
          description: s.desc,
          updatedBy: session.userId,
        });
      }
    }

    await auditAction({
      action: 'SYSTEM_SETTINGS_UPDATED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'SETTINGS',
      metadata: { count: settingsEntries.length },
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update settings.';
    return { success: false, error: msg };
  }
}

export async function generateEnrollmentTokenAction(formData: FormData): Promise<SettingsResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const label = (formData.get('label') as string)?.trim() || 'Default Enrollment Key';
  const maxUses = parseInt((formData.get('maxUses') as string) || '100', 10);
  const expiryDays = parseInt((formData.get('expiryDays') as string) || '30', 10);

  const rawToken = `EM-${crypto.randomBytes(24).toString('hex').toUpperCase()}`;
  const hashedToken = await bcrypt.hash(rawToken, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (isNaN(expiryDays) ? 30 : expiryDays));

  try {
    await db.insert(schema.enrollmentTokens).values({
      token: hashedToken,
      label,
      createdBy: session.userId,
      maxUses: isNaN(maxUses) ? 100 : maxUses,
      useCount: 0,
      enabled: true,
      expiresAt,
    });

    await auditAction({
      action: 'ENROLLMENT_TOKEN_CREATED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'ENROLLMENT_TOKEN',
      metadata: { label, maxUses },
    });

    revalidatePath('/admin/settings');
    return { success: true, generatedToken: rawToken };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate enrollment token.';
    return { success: false, error: msg };
  }
}

export async function revokeTokenAction(tokenId: string): Promise<SettingsResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  try {
    await db.update(schema.enrollmentTokens).set({ enabled: false }).where(eq(schema.enrollmentTokens.id, tokenId));
    await auditAction({
      action: 'ENROLLMENT_TOKEN_REVOKED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'ENROLLMENT_TOKEN',
      resourceId: tokenId,
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to revoke token.' };
  }
}
