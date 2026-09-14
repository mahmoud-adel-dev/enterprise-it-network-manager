'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { createUser, changePassword, validatePasswordStrength } from '@/server/auth';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';

export interface AdminUserActionResponse {
  success: boolean;
  error?: string;
}

export async function createUserAdminAction(formData: FormData): Promise<AdminUserActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const displayName = (formData.get('displayName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || undefined;
  const password = (formData.get('password') as string) || '';
  const roleName = (formData.get('roleName') as string) || 'VIEWER';

  if (!username || !displayName || !password) {
    return { success: false, error: 'Username, display name, and password are required.' };
  }

  // Check password strength
  const pwdErrors = validatePasswordStrength(password);
  if (pwdErrors.length > 0) {
    return { success: false, error: pwdErrors.join(' ') };
  }

  // Check unique username
  const existing = await db.select().from(schema.users).where(eq(schema.users.username, username)).get();
  if (existing) {
    return { success: false, error: 'A user with this username already exists.' };
  }

  try {
    await createUser({
      username,
      displayName,
      email,
      password,
      roleNames: [roleName],
      createdByUserId: session.userId,
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create user.';
    return { success: false, error: msg };
  }
}

export async function toggleUserEnabledAction(userId: string): Promise<AdminUserActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  if (userId === session.userId) {
    return { success: false, error: 'You cannot disable your own user account.' };
  }

  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return { success: false, error: 'User not found.' };

  const newEnabled = !user.enabled;
  await db.update(schema.users).set({
    enabled: newEnabled,
    updatedAt: new Date(),
  }).where(eq(schema.users.id, userId));

  await auditAction({
    action: newEnabled ? 'USER_ENABLED' : 'USER_DISABLED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'USER',
    resourceId: userId,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function resetUserPasswordAction(formData: FormData): Promise<AdminUserActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const userId = (formData.get('userId') as string)?.trim();
  const newPassword = (formData.get('newPassword') as string) || '';

  if (!userId || !newPassword) {
    return { success: false, error: 'User ID and new password are required.' };
  }

  const pwdErrors = validatePasswordStrength(newPassword);
  if (pwdErrors.length > 0) {
    return { success: false, error: pwdErrors.join(' ') };
  }

  try {
    await changePassword({
      userId,
      newPassword,
      bypassCurrentCheck: true,
      changedByUserId: session.userId,
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reset password.';
    return { success: false, error: msg };
  }
}
