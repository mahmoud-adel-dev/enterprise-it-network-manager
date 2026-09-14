import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices';

// ---- VLAN Management ----
export const vlans = sqliteTable(
  'vlans',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    vlanNumber: integer('vlan_number').notNull().unique(),
    name: text('name').notNull(),
    subnet: text('subnet'),
    cidrPrefix: integer('cidr_prefix'),
    gateway: text('gateway'),
    description: text('description'),
    site: text('site'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('vlans_number_idx').on(t.vlanNumber),
  ],
);

// ---- Network Infrastructure Devices ----
export const networkDevices = sqliteTable(
  'network_devices',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    hostname: text('hostname'),
    managementIp: text('management_ip').notNull().unique(),
    deviceType: text('device_type').notNull(), // ROUTER|SWITCH|FIREWALL|ACCESS_POINT|CONTROLLER|OTHER
    manufacturer: text('manufacturer'),
    model: text('model'),
    serialNumber: text('serial_number'),
    osName: text('os_name'),
    osVersion: text('os_version'),
    snmpEnabled: integer('snmp_enabled', { mode: 'boolean' }).notNull().default(false),
    snmpVersion: text('snmp_version'), // v1|v2c|v3
    snmpCommunity: text('snmp_community'), // encrypted reference
    snmpCredentialId: text('snmp_credential_id'),
    site: text('site'),
    rack: text('rack'),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
    status: text('status').notNull().default('UNKNOWN'), // ONLINE|OFFLINE|UNKNOWN
    sysDescr: text('sys_descr'),
    sysContact: text('sys_contact'),
    sysLocation: text('sys_location'),
    uptimeSeconds: integer('uptime_seconds'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('network_devices_ip_idx').on(t.managementIp),
    index('network_devices_type_idx').on(t.deviceType),
    index('network_devices_status_idx').on(t.status),
  ],
);

// ---- SNMP Credentials (encrypted at rest) ----
export const snmpCredentials = sqliteTable('snmp_credentials', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  label: text('label').notNull(),
  version: text('version').notNull().default('v2c'), // v1|v2c|v3
  community: text('community'), // encrypted
  securityLevel: text('security_level'), // noAuthNoPriv|authNoPriv|authPriv
  username: text('username'), // v3
  authProtocol: text('auth_protocol'), // MD5|SHA
  authPassphrase: text('auth_passphrase'), // encrypted
  privProtocol: text('priv_protocol'), // DES|AES
  privPassphrase: text('priv_passphrase'), // encrypted
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ---- Switch Ports ----
export const switchPorts = sqliteTable(
  'switch_ports',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    networkDeviceId: text('network_device_id').notNull().references(() => networkDevices.id, { onDelete: 'cascade' }),
    interfaceIndex: integer('interface_index'),
    name: text('name').notNull(),
    description: text('description'),
    adminStatus: text('admin_status'), // up|down|testing
    operationalStatus: text('operational_status'), // up|down|testing|unknown|dormant|notPresent|lowerLayerDown
    speed: integer('speed'), // in Mbps
    macAddress: text('mac_address'),
    accessVlan: integer('access_vlan'),
    nativeVlan: integer('native_vlan'),
    trunkMode: integer('trunk_mode', { mode: 'boolean' }).default(false),
    lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('switch_ports_device_idx').on(t.networkDeviceId),
    index('switch_ports_mac_idx').on(t.macAddress),
  ],
);

// ---- MAC Address Table (for switch-to-endpoint correlation) ----
export const macAddressTable = sqliteTable(
  'mac_address_table',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    networkDeviceId: text('network_device_id').notNull().references(() => networkDevices.id, { onDelete: 'cascade' }),
    switchPortId: text('switch_port_id').references(() => switchPorts.id, { onDelete: 'set null' }),
    macAddress: text('mac_address').notNull(),
    vlanId: integer('vlan_id'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('mac_table_device_idx').on(t.networkDeviceId),
    index('mac_table_mac_idx').on(t.macAddress),
  ],
);

// ---- Network Topology Links ----
export const networkLinks = sqliteTable(
  'network_links',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sourceDeviceId: text('source_device_id').notNull().references(() => networkDevices.id, { onDelete: 'cascade' }),
    sourceInterface: text('source_interface'),
    destinationDeviceId: text('destination_device_id').references(() => networkDevices.id, { onDelete: 'set null' }),
    destinationInterface: text('destination_interface'),
    destinationHostname: text('destination_hostname'), // when device not yet in inventory
    destinationIp: text('destination_ip'),
    discoveryProtocol: text('discovery_protocol').notNull().default('LLDP'), // LLDP|CDP|MANUAL
    confidence: text('confidence').notNull().default('INFERRED'), // CONFIRMED|INFERRED|MANUAL
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('network_links_source_idx').on(t.sourceDeviceId),
    index('network_links_dest_idx').on(t.destinationDeviceId),
  ],
);

// ---- Network Discovery Scopes ----
export const networkScopes = sqliteTable(
  'network_scopes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    cidr: text('cidr').notNull(),
    vlanId: text('vlan_id'),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    scanIntervalMinutes: integer('scan_interval_minutes').notNull().default(60),
    lastScanAt: integer('last_scan_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('network_scopes_enabled_idx').on(t.enabled),
  ],
);

// ---- Discovery Runs ----
export const discoveryRuns = sqliteTable(
  'discovery_runs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    scopeId: text('scope_id').notNull().references(() => networkScopes.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('PENDING'), // PENDING|RUNNING|COMPLETED|FAILED
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    hostsChecked: integer('hosts_checked').notNull().default(0),
    hostsResponded: integer('hosts_responded').notNull().default(0),
    errors: text('errors'), // JSON array of error messages
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('discovery_runs_scope_idx').on(t.scopeId),
    index('discovery_runs_status_idx').on(t.status),
  ],
);

// ---- Discovery Results ----
export const discoveryResults = sqliteTable(
  'discovery_results',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    runId: text('run_id').notNull().references(() => discoveryRuns.id, { onDelete: 'cascade' }),
    ipAddress: text('ip_address').notNull(),
    macAddress: text('mac_address'),
    hostname: text('hostname'),
    vendor: text('vendor'),
    responseMethod: text('response_method'), // ICMP|ARP|SNMP|AGENT
    discoveredAt: integer('discovered_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('discovery_results_run_idx').on(t.runId),
    index('discovery_results_ip_idx').on(t.ipAddress),
  ],
);

export type Vlan = typeof vlans.$inferSelect;
export type NetworkDevice = typeof networkDevices.$inferSelect;
export type SwitchPort = typeof switchPorts.$inferSelect;
export type NetworkScope = typeof networkScopes.$inferSelect;
export type DiscoveryRun = typeof discoveryRuns.$inferSelect;
export type DiscoveryResult = typeof discoveryResults.$inferSelect;
