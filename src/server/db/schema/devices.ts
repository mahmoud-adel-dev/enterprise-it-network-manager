import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { vlans } from './network';
import { networkDevices } from './network';

export const managementStatuses = [
  'DISCOVERED',
  'UNMANAGED',
  'PENDING_APPROVAL',
  'MANAGED',
  'QUARANTINED',
  'RETIRED',
] as const;
export type ManagementStatus = (typeof managementStatuses)[number];

export const onlineStatuses = ['ONLINE', 'OFFLINE', 'UNKNOWN'] as const;
export type OnlineStatus = (typeof onlineStatuses)[number];

export const domainStatuses = [
  'DOMAIN_JOINED',
  'WORKGROUP',
  'DOMAIN_JOIN_PENDING',
  'DOMAIN_JOIN_FAILED',
] as const;
export type DomainStatus = (typeof domainStatuses)[number];

export const approvalStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ApprovalStatus = (typeof approvalStatuses)[number];

export const devices = sqliteTable(
  'devices',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceUuid: text('device_uuid').notNull().unique(),
    hostname: text('hostname').notNull(),
    fqdn: text('fqdn'),
    ipAddress: text('ip_address'),
    macAddress: text('mac_address'),
    manufacturer: text('manufacturer'),
    model: text('model'),
    serialNumber: text('serial_number'),
    assetTag: text('asset_tag'),
    operatingSystem: text('operating_system'),
    operatingSystemEdition: text('operating_system_edition'),
    osVersion: text('os_version'),
    osBuild: text('os_build'),
    osDisplayVersion: text('os_display_version'),
    osClassification: text('os_classification'), // windows10|windows11|windowsserver|other
    architecture: text('architecture'),
    cpu: text('cpu'),
    cpuCores: integer('cpu_cores'),
    totalMemory: integer('total_memory'),
    diskTotal: integer('disk_total'),
    diskFree: integer('disk_free'),
    loggedInUser: text('logged_in_user'),
    domainName: text('domain_name'),
    domainStatus: text('domain_status', { enum: domainStatuses }).notNull().default('WORKGROUP'),
    organizationalUnit: text('organizational_unit'),
    agentInstalled: integer('agent_installed', { mode: 'boolean' }).notNull().default(false),
    agentVersion: text('agent_version'),
    agentId: text('agent_id'),
    agentToken: text('agent_token'), // hashed bearer token for agent auth
    managementStatus: text('management_status', { enum: managementStatuses }).notNull().default('DISCOVERED'),
    approvalStatus: text('approval_status', { enum: approvalStatuses }).notNull().default('PENDING'),
    approvedBy: text('approved_by'),
    approvedAt: integer('approved_at', { mode: 'timestamp_ms' }),
    vlanId: text('vlan_id'),
    networkDeviceId: text('network_device_id'),
    switchPortId: text('switch_port_id'),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
    lastBootAt: integer('last_boot_at', { mode: 'timestamp_ms' }),
    lastInventoryAt: integer('last_inventory_at', { mode: 'timestamp_ms' }),
    lastSoftwareInventoryAt: integer('last_software_inventory_at', { mode: 'timestamp_ms' }),
    onlineStatus: text('online_status', { enum: onlineStatuses }).notNull().default('UNKNOWN'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('devices_uuid_idx').on(t.deviceUuid),
    index('devices_hostname_idx').on(t.hostname),
    index('devices_ip_idx').on(t.ipAddress),
    index('devices_mac_idx').on(t.macAddress),
    index('devices_management_idx').on(t.managementStatus),
    index('devices_online_idx').on(t.onlineStatus),
    index('devices_os_class_idx').on(t.osClassification),
    index('devices_domain_idx').on(t.domainStatus),
    index('devices_approval_idx').on(t.approvalStatus),
    index('devices_vlan_idx').on(t.vlanId),
    index('devices_agent_id_idx').on(t.agentId),
  ],
);

// Enrollment tokens for agent enrollment
export const enrollmentTokens = sqliteTable(
  'enrollment_tokens',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text('token').notNull().unique(), // stored as a hash
    label: text('label').notNull(),
    createdBy: text('created_by').notNull(),
    usedAt: integer('used_at', { mode: 'timestamp_ms' }),
    usedByDeviceId: text('used_by_device_id'),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    maxUses: integer('max_uses').default(1),
    useCount: integer('use_count').notNull().default(0),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('enrollment_tokens_token_idx').on(t.token),
  ],
);

// Device network interfaces
export const deviceInterfaces = sqliteTable(
  'device_interfaces',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    interfaceId: text('interface_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    interfaceType: text('interface_type'),
    operationalStatus: text('operational_status'),
    macAddress: text('mac_address'),
    ipv4Addresses: text('ipv4_addresses'), // JSON array
    speedBitsPerSecond: integer('speed_bits_per_second'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('device_interfaces_device_idx').on(t.deviceId),
    index('device_interfaces_mac_idx').on(t.macAddress),
  ],
);

// IP history
export const deviceIpHistory = sqliteTable(
  'device_ip_history',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    ipAddress: text('ip_address').notNull(),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('device_ip_history_device_idx').on(t.deviceId),
    index('device_ip_history_ip_idx').on(t.ipAddress),
  ],
);

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type EnrollmentToken = typeof enrollmentTokens.$inferSelect;
export type DeviceInterface = typeof deviceInterfaces.$inferSelect;
