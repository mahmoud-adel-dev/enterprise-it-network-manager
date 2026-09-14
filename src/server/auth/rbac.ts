import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';

// ---- Permission Definitions ----
export const ALL_PERMISSIONS = [
  // Users
  { code: 'users.read', description: 'View user accounts' },
  { code: 'users.create', description: 'Create user accounts' },
  { code: 'users.update', description: 'Update user accounts' },
  { code: 'users.disable', description: 'Enable/disable user accounts' },
  { code: 'users.delete', description: 'Delete user accounts' },
  // Devices
  { code: 'devices.read', description: 'View devices' },
  { code: 'devices.manage', description: 'Manage devices' },
  { code: 'devices.approve', description: 'Approve/reject devices' },
  { code: 'devices.delete', description: 'Delete device records' },
  // Applications
  { code: 'applications.read', description: 'View application catalog' },
  { code: 'applications.manage', description: 'Manage application packages' },
  // Deployments
  { code: 'deployments.read', description: 'View deployments' },
  { code: 'deployments.create', description: 'Create deployments' },
  { code: 'deployments.cancel', description: 'Cancel deployments' },
  // Domain
  { code: 'domain.read', description: 'View domain information' },
  { code: 'domain.join', description: 'Initiate domain join' },
  { code: 'domain.manage', description: 'Manage domain settings' },
  // Network
  { code: 'network.read', description: 'View network inventory' },
  { code: 'network.scan', description: 'Trigger network scans' },
  { code: 'network.manage', description: 'Manage network devices and scopes' },
  // Topology
  { code: 'topology.read', description: 'View network topology' },
  // Audit
  { code: 'audit.read', description: 'View audit logs and system events' },
  // Settings
  { code: 'settings.read', description: 'View system settings' },
  { code: 'settings.manage', description: 'Modify system settings' },
  // Reports
  { code: 'reports.read', description: 'Access reports' },
  // Groups
  { code: 'groups.read', description: 'View device groups' },
  { code: 'groups.manage', description: 'Manage device groups' },
  // Policies
  { code: 'policies.read', description: 'View software policies' },
  { code: 'policies.manage', description: 'Manage software policies' },
] as const;

export type PermissionCode = (typeof ALL_PERMISSIONS)[number]['code'];

export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.code),
  IT_ADMIN: [
    'users.read',
    'devices.read', 'devices.manage', 'devices.approve',
    'applications.read', 'applications.manage',
    'deployments.read', 'deployments.create', 'deployments.cancel',
    'domain.read', 'domain.join',
    'network.read', 'network.scan',
    'topology.read',
    'audit.read',
    'settings.read',
    'reports.read',
    'groups.read', 'groups.manage',
    'policies.read', 'policies.manage',
  ],
  NETWORK_ADMIN: [
    'devices.read',
    'network.read', 'network.scan', 'network.manage',
    'topology.read',
    'audit.read',
    'settings.read',
    'reports.read',
    'groups.read',
  ],
  HELPDESK: [
    'devices.read',
    'applications.read',
    'deployments.read',
    'domain.read',
    'network.read',
    'topology.read',
    'groups.read',
    'reports.read',
  ],
  AUDITOR: [
    'devices.read',
    'applications.read',
    'deployments.read',
    'domain.read',
    'network.read',
    'topology.read',
    'audit.read',
    'reports.read',
    'groups.read',
    'policies.read',
  ],
  VIEWER: [
    'devices.read',
    'network.read',
    'topology.read',
    'groups.read',
  ],
};

export const DEFAULT_ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full system access' },
  { name: 'IT_ADMIN', description: 'Device, application, deployment, and network management' },
  { name: 'NETWORK_ADMIN', description: 'Network discovery, topology, and infrastructure management' },
  { name: 'HELPDESK', description: 'View devices and authorized support operations' },
  { name: 'AUDITOR', description: 'Read-only access to logs, reports, and history' },
  { name: 'VIEWER', description: 'Read-only dashboard access' },
];

/**
 * Run this once at startup to ensure roles and permissions exist.
 * Idempotent — safe to call multiple times.
 */
export async function seedRolesAndPermissions(): Promise<void> {
  // Upsert all permissions
  for (const perm of ALL_PERMISSIONS) {
    const existing = await db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.code, perm.code))
      .get();
    if (!existing) {
      await db.insert(schema.permissions).values({
        code: perm.code,
        description: perm.description,
      });
    }
  }

  // Upsert all roles
  for (const role of DEFAULT_ROLES) {
    const existing = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, role.name))
      .get();

    let roleId: string;
    if (!existing) {
      const [inserted] = await db.insert(schema.roles).values(role).returning({ id: schema.roles.id });
      roleId = inserted!.id;
    } else {
      roleId = existing.id;
    }

    // Assign permissions for the role
    const permCodes = ROLE_PERMISSIONS[role.name] ?? [];
    for (const code of permCodes) {
      const perm = await db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.code, code))
        .get();
      if (!perm) continue;

      const existingLink = await db
        .select()
        .from(schema.rolePermissions)
        .where(and(eq(schema.rolePermissions.roleId, roleId), eq(schema.rolePermissions.permissionId, perm.id)))
        .get();

      if (!existingLink) {
        await db.insert(schema.rolePermissions).values({ roleId, permissionId: perm.id });
      }
    }
  }
}

/**
 * Get all permission codes for a user (via their roles).
 * Returns a Set for O(1) lookups.
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ code: schema.permissions.code })
    .from(schema.userRoles)
    .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.userRoles.userId, userId));

  return new Set(rows.map((r) => r.code));
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.has(permission);
}

/**
 * Get all roles for a user.
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: schema.roles.name })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));
  return rows.map((r) => r.name);
}

/**
 * Check if setup has been completed (any admin user exists).
 */
export async function isSetupComplete(): Promise<boolean> {
  const adminRole = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(eq(schema.roles.name, 'SUPER_ADMIN'))
    .get();

  if (!adminRole) return false;

  const admin = await db
    .select({ id: schema.userRoles.userId })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.roleId, adminRole.id))
    .get();

  return admin !== undefined;
}
