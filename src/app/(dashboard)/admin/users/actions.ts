'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { getUserRoles } from '@/server/auth/rbac';
import { createUser, changePassword, validatePasswordStrength } from '@/server/auth';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';

export interface AdminUserActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Strict Super Admin authorization guard.
 * Rejects any caller who is unauthenticated or not holding the SUPER_ADMIN role.
 */
async function verifySuperAdmin(): Promise<
  | { session: NonNullable<Awaited<ReturnType<typeof getSession>>> }
  | { error: string }
> {
  const session = await getSession();
  if (!session) {
    return { error: 'غير مصرح: يجب تسجيل الدخول أولاً للقيام بهذا الإجراء.' };
  }

  const roles = await getUserRoles(session.userId);
  if (!roles.includes('SUPER_ADMIN')) {
    await auditAction({
      action: 'SECURITY_ALERT',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'USER_ADMIN_MUTATION',
      metadata: {
        violation: 'NON_SUPER_ADMIN_BLOCKED_ACTION',
        roles,
      },
    });
    return { error: 'غير مصرح: هذا الإجراء مخصص حصرياً للمديرين برتبة (سوبر أدمن - SUPER_ADMIN).' };
  }

  return { session };
}

function calculateExpiryDate(duration: string, customDateStr?: string): Date | null {
  const now = Date.now();
  switch (duration) {
    case '7_DAYS':
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    case '30_DAYS':
      return new Date(now + 30 * 24 * 60 * 60 * 1000);
    case '90_DAYS':
      return new Date(now + 90 * 24 * 60 * 60 * 1000);
    case '180_DAYS':
      return new Date(now + 180 * 24 * 60 * 60 * 1000);
    case '365_DAYS':
      return new Date(now + 365 * 24 * 60 * 60 * 1000);
    case 'CUSTOM':
      if (customDateStr) {
        const d = new Date(customDateStr);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    case 'EXPIRED_NOW':
      // Immediately set to expired (yesterday)
      return new Date(now - 24 * 60 * 60 * 1000);
    case 'UNLIMITED':
    default:
      return null;
  }
}

export async function createUserAdminAction(formData: FormData): Promise<AdminUserActionResponse> {
  const auth = await verifySuperAdmin();
  if ('error' in auth) return { success: false, error: auth.error };
  const session = auth.session;

  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const displayName = (formData.get('displayName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || undefined;
  const password = (formData.get('password') as string) || '';
  const roleName = (formData.get('roleName') as string) || 'VIEWER';
  const planName = (formData.get('planName') as string) || 'ENTERPRISE';
  const planDuration = (formData.get('planDuration') as string) || 'UNLIMITED';
  const customExpiresAt = (formData.get('customExpiresAt') as string) || undefined;
  const maxManagedDevices = parseInt((formData.get('maxManagedDevices') as string) || '100', 10);
  const notes = (formData.get('notes') as string)?.trim() || undefined;

  if (!username || !displayName || !password) {
    return { success: false, error: 'اسم المستخدم واسم العرض وكلمة المرور مطلوبة.' };
  }

  // Check password strength
  const pwdErrors = validatePasswordStrength(password);
  if (pwdErrors.length > 0) {
    return { success: false, error: pwdErrors.join(' ') };
  }

  // Check unique username
  const existing = await db.select().from(schema.users).where(eq(schema.users.username, username)).get();
  if (existing) {
    return { success: false, error: 'اسم المستخدم هذا مستخدم بالفعل.' };
  }

  const planExpiresAt = calculateExpiryDate(planDuration, customExpiresAt);

  try {
    await createUser({
      username,
      displayName,
      email,
      password,
      roleNames: [roleName],
      planName,
      planExpiresAt,
      maxManagedDevices: isNaN(maxManagedDevices) ? 100 : maxManagedDevices,
      notes,
      createdByUserId: session.userId,
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل إنشاء المستخدم.';
    return { success: false, error: msg };
  }
}

export async function toggleUserEnabledAction(userId: string): Promise<AdminUserActionResponse> {
  const auth = await verifySuperAdmin();
  if ('error' in auth) return { success: false, error: auth.error };
  const session = auth.session;

  if (userId === session.userId) {
    return { success: false, error: 'لا يمكنك تعطيل حسابك الشخصي الحالي.' };
  }

  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return { success: false, error: 'المستخدم غير موجود.' };

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

export async function updateUserPlanAction(formData: FormData): Promise<AdminUserActionResponse> {
  const auth = await verifySuperAdmin();
  if ('error' in auth) return { success: false, error: auth.error };
  const session = auth.session;

  const userId = (formData.get('userId') as string)?.trim();
  const planName = (formData.get('planName') as string)?.trim() || 'ENTERPRISE';
  const planDuration = (formData.get('planDuration') as string) || 'UNLIMITED';
  const customExpiresAt = (formData.get('customExpiresAt') as string) || undefined;
  const maxManagedDevices = parseInt((formData.get('maxManagedDevices') as string) || '100', 10);
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!userId) {
    return { success: false, error: 'معرّف المستخدم مطلوب.' };
  }

  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return { success: false, error: 'المستخدم غير موجود.' };

  const planExpiresAt = calculateExpiryDate(planDuration, customExpiresAt);

  try {
    await db.update(schema.users).set({
      planName,
      planExpiresAt,
      maxManagedDevices: isNaN(maxManagedDevices) ? 100 : maxManagedDevices,
      notes,
      updatedAt: new Date(),
    }).where(eq(schema.users.id, userId));

    await auditAction({
      action: 'USER_PLAN_UPDATED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'USER',
      resourceId: userId,
      metadata: { planName, planExpiresAt: planExpiresAt?.toISOString() ?? 'UNLIMITED' },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل تحديث باقة وصلاحية المستخدم.';
    return { success: false, error: msg };
  }
}

export async function resetUserPasswordAction(formData: FormData): Promise<AdminUserActionResponse> {
  const auth = await verifySuperAdmin();
  if ('error' in auth) return { success: false, error: auth.error };
  const session = auth.session;

  const userId = (formData.get('userId') as string)?.trim();
  const newPassword = (formData.get('newPassword') as string) || '';

  if (!userId || !newPassword) {
    return { success: false, error: 'معرف المستخدم وكلمة المرور الجديدة مطلوبان.' };
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
    const msg = err instanceof Error ? err.message : 'فشل تغيير كلمة المرور.';
    return { success: false, error: msg };
  }
}

export async function deleteUserAdminAction(userId: string): Promise<AdminUserActionResponse> {
  const auth = await verifySuperAdmin();
  if ('error' in auth) return { success: false, error: auth.error };
  const session = auth.session;

  if (userId === session.userId) {
    return { success: false, error: 'لا يمكنك حذف حسابك الحالي المسجل به.' };
  }

  // Ensure this is not the only super admin
  const superAdminRole = await db.select().from(schema.roles).where(eq(schema.roles.name, 'SUPER_ADMIN')).get();
  if (superAdminRole) {
    const userRoleLink = await db
      .select()
      .from(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, superAdminRole.id)))
      .get();

    if (userRoleLink) {
      const allSuperAdmins = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.roleId, superAdminRole.id));

      if (allSuperAdmins.length <= 1) {
        return { success: false, error: 'لا يمكن حذف هذا الحساب لأنه المدير الوحيد المتبقي في النظام.' };
      }
    }
  }

  try {
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    await auditAction({
      action: 'USER_DELETED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'USER',
      resourceId: userId,
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل حذف الحساب.';
    return { success: false, error: msg };
  }
}
