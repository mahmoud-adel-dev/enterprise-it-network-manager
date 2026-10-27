import 'server-only';
import bcrypt from 'bcryptjs';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserPermissions, getUserRoles, seedRolesAndPermissions } from './rbac';
import { auditAction } from '@/server/services/audit';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

// Password policy
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long.`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return errors;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    displayName: string;
    forcePasswordChange: boolean;
  };
  error?: string;
  errorCode?: string;
}

export async function authenticateUser(
  username: string,
  password: string,
  sourceIp?: string,
  userAgent?: string,
): Promise<AuthResult> {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username.toLowerCase()))
    .get();

  if (!user) {
    await auditAction({
      action: 'LOGIN_FAILED',
      success: false,
      sourceIp,
      userAgent,
      metadata: { reason: 'USER_NOT_FOUND', username },
    });
    return { success: false, error: 'Invalid username or password.', errorCode: 'INVALID_CREDENTIALS' };
  }

  // Check account enabled
  if (!user.enabled) {
    await auditAction({
      action: 'LOGIN_FAILED',
      userId: user.id,
      usernameSnapshot: user.username,
      success: false,
      sourceIp,
      userAgent,
      metadata: { reason: 'ACCOUNT_DISABLED' },
    });
    return { success: false, error: 'تم تعطيل هذا الحساب من قبل الإدارة.', errorCode: 'ACCOUNT_DISABLED' };
  }

  // Check plan validity / expiration
  if (user.planExpiresAt && user.planExpiresAt < new Date()) {
    await auditAction({
      action: 'LOGIN_FAILED',
      userId: user.id,
      usernameSnapshot: user.username,
      success: false,
      sourceIp,
      userAgent,
      metadata: { reason: 'PLAN_EXPIRED', planExpiresAt: user.planExpiresAt },
    });
    return {
      success: false,
      error: 'انتهت فترة صلاحية هذا الحساب (الباقة منتهية). يرجى مراجعة المشرف لتجديد الباقة.',
      errorCode: 'PLAN_EXPIRED',
    };
  }

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await auditAction({
      action: 'LOGIN_FAILED',
      userId: user.id,
      usernameSnapshot: user.username,
      success: false,
      sourceIp,
      userAgent,
      metadata: { reason: 'ACCOUNT_LOCKED' },
    });
    return { success: false, error: 'Account is temporarily locked. Please try again later.', errorCode: 'ACCOUNT_LOCKED' };
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    const newFailedCount = user.failedLoginCount + 1;
    const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
      : null;

    await db
      .update(schema.users)
      .set({
        failedLoginCount: newFailedCount,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    await auditAction({
      action: 'LOGIN_FAILED',
      userId: user.id,
      usernameSnapshot: user.username,
      success: false,
      sourceIp,
      userAgent,
      metadata: { reason: 'INVALID_PASSWORD', failedAttempts: newFailedCount, locked: shouldLock },
    });

    return { success: false, error: 'Invalid username or password.', errorCode: 'INVALID_CREDENTIALS' };
  }

  // Success — reset failed count, update lastLogin
  await db
    .update(schema.users)
    .set({
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  await auditAction({
    action: 'LOGIN_SUCCESS',
    userId: user.id,
    usernameSnapshot: user.username,
    success: true,
    sourceIp,
    userAgent,
  });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      forcePasswordChange: user.forcePasswordChange,
    },
  };
}

export async function createUser(params: {
  username: string;
  displayName: string;
  email?: string;
  password: string;
  roleNames: string[];
  forcePasswordChange?: boolean;
  planExpiresAt?: Date | null;
  planName?: string;
  maxManagedDevices?: number;
  notes?: string;
  createdByUserId: string;
  sourceIp?: string;
}): Promise<{ id: string }> {
  const passwordHash = await hashPassword(params.password);

  const [user] = await db
    .insert(schema.users)
    .values({
      username: params.username.toLowerCase(),
      displayName: params.displayName,
      email: params.email,
      passwordHash,
      forcePasswordChange: params.forcePasswordChange ?? false,
      planExpiresAt: params.planExpiresAt ?? null,
      planName: params.planName ?? 'ENTERPRISE',
      maxManagedDevices: params.maxManagedDevices ?? 100,
      notes: params.notes,
    })
    .returning({ id: schema.users.id });

  if (!user) throw new Error('Failed to create user.');

  // Assign roles
  for (const roleName of params.roleNames) {
    const role = await db
      .select({ id: schema.roles.id })
      .from(schema.roles)
      .where(eq(schema.roles.name, roleName))
      .get();
    if (role) {
      await db.insert(schema.userRoles).values({ userId: user.id, roleId: role.id });
    }
  }

  await auditAction({
    action: 'USER_CREATED',
    userId: params.createdByUserId,
    resourceType: 'USER',
    resourceId: user.id,
    success: true,
    sourceIp: params.sourceIp,
    metadata: { username: params.username, roles: params.roleNames },
  });

  return { id: user.id };
}

/**
 * Bootstrap the first SUPER_ADMIN. Only callable when no admins exist.
 */
export async function bootstrapAdmin(params: {
  username: string;
  displayName: string;
  password: string;
}): Promise<{ id: string }> {
  // Ensure roles/permissions seeded
  await seedRolesAndPermissions();

  const passwordHash = await hashPassword(params.password);

  const [user] = await db
    .insert(schema.users)
    .values({
      username: params.username.toLowerCase(),
      displayName: params.displayName,
      passwordHash,
    })
    .returning({ id: schema.users.id });

  if (!user) throw new Error('Failed to create admin user.');

  const adminRole = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(eq(schema.roles.name, 'SUPER_ADMIN'))
    .get();

  if (adminRole) {
    await db.insert(schema.userRoles).values({ userId: user.id, roleId: adminRole.id });
  }

  await auditAction({
    action: 'USER_CREATED',
    userId: user.id,
    usernameSnapshot: params.username,
    resourceType: 'USER',
    resourceId: user.id,
    success: true,
    metadata: { type: 'BOOTSTRAP_ADMIN' },
  });

  return { id: user.id };
}

export async function changePassword(params: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
  bypassCurrentCheck?: boolean;
  changedByUserId?: string;
}): Promise<void> {
  const user = await db.select().from(schema.users).where(eq(schema.users.id, params.userId)).get();
  if (!user) throw new Error('User not found.');

  if (!params.bypassCurrentCheck && params.currentPassword) {
    const valid = await verifyPassword(params.currentPassword, user.passwordHash);
    if (!valid) throw new Error('Current password is incorrect.');
  }

  const newHash = await hashPassword(params.newPassword);

  await db
    .update(schema.users)
    .set({
      passwordHash: newHash,
      forcePasswordChange: false,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, params.userId));

  await auditAction({
    action: 'PASSWORD_CHANGED',
    userId: params.changedByUserId ?? params.userId,
    resourceType: 'USER',
    resourceId: params.userId,
    success: true,
  });
}

export { getUserPermissions, getUserRoles };
