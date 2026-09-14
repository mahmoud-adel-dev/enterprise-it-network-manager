import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices';

// ---- Audit Logs ----
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    userId: text('user_id'),
    usernameSnapshot: text('username_snapshot'),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    success: integer('success', { mode: 'boolean' }).notNull().default(true),
    sourceIp: text('source_ip'),
    userAgent: text('user_agent'),
    metadata: text('metadata'), // JSON - NEVER store passwords/secrets
    errorCode: text('error_code'),
  },
  (t) => [
    index('audit_logs_timestamp_idx').on(t.timestamp),
    index('audit_logs_user_idx').on(t.userId),
    index('audit_logs_action_idx').on(t.action),
    index('audit_logs_resource_idx').on(t.resourceType, t.resourceId),
  ],
);

// ---- System Events ----
export const systemEvents = sqliteTable(
  'system_events',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    event: text('event').notNull(), // DEVICE_ONLINE|DEVICE_OFFLINE|AGENT_UPGRADED|etc
    deviceId: text('device_id').references(() => devices.id, { onDelete: 'set null' }),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    metadata: text('metadata'), // JSON
    severity: text('severity').notNull().default('INFO'), // DEBUG|INFO|WARN|ERROR
  },
  (t) => [
    index('system_events_timestamp_idx').on(t.timestamp),
    index('system_events_event_idx').on(t.event),
    index('system_events_device_idx').on(t.deviceId),
    index('system_events_severity_idx').on(t.severity),
  ],
);

// ---- Domain Join Jobs ----
export const domainJoinJobs = sqliteTable(
  'domain_join_jobs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    targetOu: text('target_ou'),
    requestedBy: text('requested_by').notNull(),
    status: text('status').notNull().default('PENDING'), // PENDING|VALIDATING|JOINING|RESTART_REQUIRED|WAITING_FOR_RECONNECT|VERIFYING|SUCCESS|FAILED|CANCELLED
    errorMessage: text('error_message'),
    leaseToken: text('lease_token'),
    leaseExpiresAt: integer('lease_expires_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('domain_join_jobs_device_idx').on(t.deviceId),
    index('domain_join_jobs_status_idx').on(t.status),
  ],
);

// ---- Background Job Queue ----
export const jobQueue = sqliteTable(
  'job_queue',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    jobType: text('job_type').notNull(),
    payload: text('payload').notNull(), // JSON
    status: text('status').notNull().default('PENDING'), // PENDING|RUNNING|SUCCESS|FAILED|CANCELLED
    priority: integer('priority').notNull().default(5),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    errorMessage: text('error_message'),
    workerId: text('worker_id'),
    workerHeartbeatAt: integer('worker_heartbeat_at', { mode: 'timestamp_ms' }),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    nextAttemptAt: integer('next_attempt_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('job_queue_status_idx').on(t.status),
    index('job_queue_type_idx').on(t.jobType),
    index('job_queue_priority_idx').on(t.priority, t.status),
    index('job_queue_scheduled_idx').on(t.scheduledAt),
    index('job_queue_worker_idx').on(t.workerId),
  ],
);

// ---- Application Settings ----
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedBy: text('updated_by'),
});

// ---- AD Configuration ----
export const adConfiguration = sqliteTable('ad_configuration', {
  id: text('id').primaryKey().default('singleton'),
  domainFqdn: text('domain_fqdn'),
  ldapEndpoint: text('ldap_endpoint'),
  useLdaps: integer('use_ldaps', { mode: 'boolean' }).notNull().default(true),
  baseDn: text('base_dn'),
  computerOu: text('computer_ou'),
  serviceAccountUsername: text('service_account_username'),
  // password stored encrypted in app_settings with key: ad.service_account_password
  connectionVerifiedAt: integer('connection_verified_at', { mode: 'timestamp_ms' }),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ---- AD Computers (from LDAP inventory) ----
export const adComputers = sqliteTable(
  'ad_computers',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    distinguishedName: text('distinguished_name').notNull().unique(),
    samAccountName: text('sam_account_name').notNull(),
    dnsHostname: text('dns_hostname'),
    operatingSystem: text('operating_system'),
    enabled: integer('enabled', { mode: 'boolean' }),
    lastLogon: integer('last_logon', { mode: 'timestamp_ms' }),
    whenCreated: integer('when_created', { mode: 'timestamp_ms' }),
    organizationalUnit: text('organizational_unit'),
    correlatedDeviceId: text('correlated_device_id'),
    lastSyncAt: integer('last_sync_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('ad_computers_sam_idx').on(t.samAccountName),
    index('ad_computers_hostname_idx').on(t.dnsHostname),
    index('ad_computers_device_idx').on(t.correlatedDeviceId),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type SystemEvent = typeof systemEvents.$inferSelect;
export type DomainJoinJob = typeof domainJoinJobs.$inferSelect;
export type JobQueueEntry = typeof jobQueue.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
