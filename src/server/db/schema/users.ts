import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    username: text('username').notNull().unique(),
    displayName: text('display_name').notNull(),
    email: text('email').unique(),
    passwordHash: text('password_hash').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    forcePasswordChange: integer('force_password_change', { mode: 'boolean' }).notNull().default(false),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: integer('locked_until', { mode: 'timestamp_ms' }),
    lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
    planExpiresAt: integer('plan_expires_at', { mode: 'timestamp_ms' }),
    planName: text('plan_name').default('ENTERPRISE'),
    maxManagedDevices: integer('max_managed_devices').default(100),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('users_username_idx').on(t.username),
    index('users_email_idx').on(t.email),
  ],
);

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  description: text('description'),
});

export const userRoles = sqliteTable(
  'user_roles',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('user_roles_user_idx').on(t.userId),
    index('user_roles_role_idx').on(t.roleId),
  ],
);

export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('role_permissions_role_idx').on(t.roleId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
