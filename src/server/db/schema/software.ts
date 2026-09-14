import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { devices } from './devices';
import { users } from './users';

// ---- Software Catalog (known applications) ----
export const softwareCatalog = sqliteTable(
  'software_catalog',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    normalizedName: text('normalized_name').notNull().unique(),
    displayName: text('display_name').notNull(),
    publisher: text('publisher'),
    category: text('category'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
);

// ---- Installed Software per Device ----
export const deviceSoftware = sqliteTable(
  'device_software',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    normalizedId: text('normalized_id').notNull(),
    name: text('name').notNull(),
    publisher: text('publisher'),
    version: text('version'),
    architecture: text('architecture').notNull().default('x64'),
    installLocation: text('install_location'),
    productCode: text('product_code'),
    firstDetectedAt: integer('first_detected_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('device_software_device_idx').on(t.deviceId),
    index('device_software_normalized_idx').on(t.normalizedId),
    index('device_software_name_idx').on(t.name),
  ],
);

// ---- Application Packages (deployment packages) ----
export const applicationPackages = sqliteTable(
  'application_packages',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    publisher: text('publisher'),
    applicationVersion: text('application_version').notNull(),
    packageVersion: text('package_version').notNull().default('1'),
    supportedOperatingSystems: text('supported_operating_systems').notNull().default('["windows10","windows11"]'), // JSON
    supportedArchitectures: text('supported_architectures').notNull().default('["x64"]'), // JSON
    installerType: text('installer_type').notNull(), // MSI|EXE
    installerFileName: text('installer_file_name').notNull(),
    installerStoragePath: text('installer_storage_path').notNull(),
    installerArguments: text('installer_arguments'), // JSON array
    uninstallArguments: text('uninstall_arguments'), // JSON array
    successExitCodes: text('success_exit_codes').default('[0,3010]'), // JSON array
    detectionType: text('detection_type').notNull(), // MSI_PRODUCT_CODE|REGISTRY_VALUE|INSTALLED_APPLICATION|FILE_VERSION|WINDOWS_SERVICE
    detectionRule: text('detection_rule').notNull(), // JSON
    sha256: text('sha256').notNull(),
    fileSize: integer('file_size').notNull(),
    timeoutMinutes: integer('timeout_minutes').default(120),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
    approvedBy: text('approved_by'),
    approvedAt: integer('approved_at', { mode: 'timestamp_ms' }),
    createdBy: text('created_by').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('app_packages_name_idx').on(t.name),
    index('app_packages_enabled_idx').on(t.enabled),
  ],
);

// ---- Deployment Jobs ----
export const deploymentJobs = sqliteTable(
  'deployment_jobs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    applicationPackageId: text('application_package_id').notNull().references(() => applicationPackages.id),
    createdBy: text('created_by').notNull(),
    targetType: text('target_type').notNull(), // INDIVIDUAL|STATIC_GROUP|SMART_GROUP|QUERY
    targetDefinition: text('target_definition').notNull(), // JSON
    status: text('status').notNull().default('QUEUED'), // QUEUED|RUNNING|COMPLETED|CANCELLED|FAILED
    totalTargets: integer('total_targets').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    failureCount: integer('failure_count').notNull().default(0),
    queuedCount: integer('queued_count').notNull().default(0),
    runningCount: integer('running_count').notNull().default(0),
    cancelledCount: integer('cancelled_count').notNull().default(0),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }),
    maintenanceWindow: text('maintenance_window'), // JSON
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('deployment_jobs_status_idx').on(t.status),
    index('deployment_jobs_package_idx').on(t.applicationPackageId),
    index('deployment_jobs_created_idx').on(t.createdAt),
  ],
);

// ---- Deployment Targets (per-device job tracking) ----
export const deploymentTargets = sqliteTable(
  'deployment_targets',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    deploymentJobId: text('deployment_job_id').notNull().references(() => deploymentJobs.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('QUEUED'), // QUEUED|DOWNLOADING|VERIFYING_PACKAGE|INSTALLING|VERIFYING_INSTALLATION|SUCCESS|FAILED|CANCELLED|RETRY_PENDING|SKIPPED
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    exitCode: integer('exit_code'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    diagnostics: text('diagnostics'),
    leaseToken: text('lease_token'),
    leaseExpiresAt: integer('lease_expires_at', { mode: 'timestamp_ms' }),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp_ms' }),
    nextAttemptAt: integer('next_attempt_at', { mode: 'timestamp_ms' }),
  },
  (t) => [
    index('deployment_targets_job_idx').on(t.deploymentJobId),
    index('deployment_targets_device_idx').on(t.deviceId),
    index('deployment_targets_status_idx').on(t.status),
    index('deployment_targets_lease_idx').on(t.leaseToken),
  ],
);

// ---- Device Groups ----
export const deviceGroups = sqliteTable(
  'device_groups',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').notNull(), // STATIC|SMART
    rules: text('rules'), // JSON for smart groups
    createdBy: text('created_by').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('device_groups_type_idx').on(t.type),
  ],
);

// ---- Static Group Members ----
export const deviceGroupMembers = sqliteTable(
  'device_group_members',
  {
    groupId: text('group_id').notNull().references(() => deviceGroups.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    addedAt: integer('added_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index('device_group_members_group_idx').on(t.groupId),
    index('device_group_members_device_idx').on(t.deviceId),
  ],
);

// ---- Software Policies ----
export const softwarePolicies = sqliteTable(
  'software_policies',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    targetGroupId: text('target_group_id').references(() => deviceGroups.id, { onDelete: 'set null' }),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    createdBy: text('created_by').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  },
);

// ---- Policy Required Applications ----
export const policyApplications = sqliteTable(
  'policy_applications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    policyId: text('policy_id').notNull().references(() => softwarePolicies.id, { onDelete: 'cascade' }),
    packageId: text('package_id').notNull().references(() => applicationPackages.id, { onDelete: 'cascade' }),
    versionMatch: text('version_match').notNull().default('ANY'), // ANY|MINIMUM|EXACT
    requiredVersion: text('required_version'),
  },
  (t) => [
    index('policy_apps_policy_idx').on(t.policyId),
  ],
);

// ---- Policy Compliance per Device ----
export const policyCompliance = sqliteTable(
  'policy_compliance',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    policyId: text('policy_id').notNull().references(() => softwarePolicies.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('PENDING'), // COMPLIANT|NON_COMPLIANT|PENDING|ERROR
    lastEvaluatedAt: integer('last_evaluated_at', { mode: 'timestamp_ms' }),
    missingPackages: text('missing_packages'), // JSON
  },
  (t) => [
    index('policy_compliance_policy_idx').on(t.policyId),
    index('policy_compliance_device_idx').on(t.deviceId),
    index('policy_compliance_status_idx').on(t.status),
  ],
);

export type DeviceSoftware = typeof deviceSoftware.$inferSelect;
export type ApplicationPackage = typeof applicationPackages.$inferSelect;
export type DeploymentJob = typeof deploymentJobs.$inferSelect;
export type DeploymentTarget = typeof deploymentTargets.$inferSelect;
export type DeviceGroup = typeof deviceGroups.$inferSelect;
export type SoftwarePolicy = typeof softwarePolicies.$inferSelect;
