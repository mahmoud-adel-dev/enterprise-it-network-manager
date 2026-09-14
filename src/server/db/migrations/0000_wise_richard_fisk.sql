CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_unique` ON `permissions` (`code`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `role_permissions_role_idx` ON `role_permissions` (`role_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_roles_user_idx` ON `user_roles` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`password_hash` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`force_password_change` integer DEFAULT false NOT NULL,
	`failed_login_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `device_interfaces` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`interface_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`interface_type` text,
	`operational_status` text,
	`mac_address` text,
	`ipv4_addresses` text,
	`speed_bits_per_second` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `device_interfaces_device_idx` ON `device_interfaces` (`device_id`);--> statement-breakpoint
CREATE INDEX `device_interfaces_mac_idx` ON `device_interfaces` (`mac_address`);--> statement-breakpoint
CREATE TABLE `device_ip_history` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `device_ip_history_device_idx` ON `device_ip_history` (`device_id`);--> statement-breakpoint
CREATE INDEX `device_ip_history_ip_idx` ON `device_ip_history` (`ip_address`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`device_uuid` text NOT NULL,
	`hostname` text NOT NULL,
	`fqdn` text,
	`ip_address` text,
	`mac_address` text,
	`manufacturer` text,
	`model` text,
	`serial_number` text,
	`asset_tag` text,
	`operating_system` text,
	`operating_system_edition` text,
	`os_version` text,
	`os_build` text,
	`os_display_version` text,
	`os_classification` text,
	`architecture` text,
	`cpu` text,
	`cpu_cores` integer,
	`total_memory` integer,
	`disk_total` integer,
	`disk_free` integer,
	`logged_in_user` text,
	`domain_name` text,
	`domain_status` text DEFAULT 'WORKGROUP' NOT NULL,
	`organizational_unit` text,
	`agent_installed` integer DEFAULT false NOT NULL,
	`agent_version` text,
	`agent_id` text,
	`agent_token` text,
	`management_status` text DEFAULT 'DISCOVERED' NOT NULL,
	`approval_status` text DEFAULT 'PENDING' NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`vlan_id` text,
	`network_device_id` text,
	`switch_port_id` text,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer,
	`last_boot_at` integer,
	`last_inventory_at` integer,
	`last_software_inventory_at` integer,
	`online_status` text DEFAULT 'UNKNOWN' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_device_uuid_unique` ON `devices` (`device_uuid`);--> statement-breakpoint
CREATE INDEX `devices_uuid_idx` ON `devices` (`device_uuid`);--> statement-breakpoint
CREATE INDEX `devices_hostname_idx` ON `devices` (`hostname`);--> statement-breakpoint
CREATE INDEX `devices_ip_idx` ON `devices` (`ip_address`);--> statement-breakpoint
CREATE INDEX `devices_mac_idx` ON `devices` (`mac_address`);--> statement-breakpoint
CREATE INDEX `devices_management_idx` ON `devices` (`management_status`);--> statement-breakpoint
CREATE INDEX `devices_online_idx` ON `devices` (`online_status`);--> statement-breakpoint
CREATE INDEX `devices_os_class_idx` ON `devices` (`os_classification`);--> statement-breakpoint
CREATE INDEX `devices_domain_idx` ON `devices` (`domain_status`);--> statement-breakpoint
CREATE INDEX `devices_approval_idx` ON `devices` (`approval_status`);--> statement-breakpoint
CREATE INDEX `devices_vlan_idx` ON `devices` (`vlan_id`);--> statement-breakpoint
CREATE INDEX `devices_agent_id_idx` ON `devices` (`agent_id`);--> statement-breakpoint
CREATE TABLE `enrollment_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`label` text NOT NULL,
	`created_by` text NOT NULL,
	`used_at` integer,
	`used_by_device_id` text,
	`expires_at` integer,
	`max_uses` integer DEFAULT 1,
	`use_count` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_tokens_token_unique` ON `enrollment_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `enrollment_tokens_token_idx` ON `enrollment_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `discovery_results` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`mac_address` text,
	`hostname` text,
	`vendor` text,
	`response_method` text,
	`discovered_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `discovery_runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `discovery_results_run_idx` ON `discovery_results` (`run_id`);--> statement-breakpoint
CREATE INDEX `discovery_results_ip_idx` ON `discovery_results` (`ip_address`);--> statement-breakpoint
CREATE TABLE `discovery_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`hosts_checked` integer DEFAULT 0 NOT NULL,
	`hosts_responded` integer DEFAULT 0 NOT NULL,
	`errors` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`scope_id`) REFERENCES `network_scopes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `discovery_runs_scope_idx` ON `discovery_runs` (`scope_id`);--> statement-breakpoint
CREATE INDEX `discovery_runs_status_idx` ON `discovery_runs` (`status`);--> statement-breakpoint
CREATE TABLE `mac_address_table` (
	`id` text PRIMARY KEY NOT NULL,
	`network_device_id` text NOT NULL,
	`switch_port_id` text,
	`mac_address` text NOT NULL,
	`vlan_id` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`network_device_id`) REFERENCES `network_devices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`switch_port_id`) REFERENCES `switch_ports`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `mac_table_device_idx` ON `mac_address_table` (`network_device_id`);--> statement-breakpoint
CREATE INDEX `mac_table_mac_idx` ON `mac_address_table` (`mac_address`);--> statement-breakpoint
CREATE TABLE `network_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`hostname` text,
	`management_ip` text NOT NULL,
	`device_type` text NOT NULL,
	`manufacturer` text,
	`model` text,
	`serial_number` text,
	`os_name` text,
	`os_version` text,
	`snmp_enabled` integer DEFAULT false NOT NULL,
	`snmp_version` text,
	`snmp_community` text,
	`snmp_credential_id` text,
	`site` text,
	`rack` text,
	`last_seen_at` integer,
	`status` text DEFAULT 'UNKNOWN' NOT NULL,
	`sys_descr` text,
	`sys_contact` text,
	`sys_location` text,
	`uptime_seconds` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `network_devices_management_ip_unique` ON `network_devices` (`management_ip`);--> statement-breakpoint
CREATE INDEX `network_devices_ip_idx` ON `network_devices` (`management_ip`);--> statement-breakpoint
CREATE INDEX `network_devices_type_idx` ON `network_devices` (`device_type`);--> statement-breakpoint
CREATE INDEX `network_devices_status_idx` ON `network_devices` (`status`);--> statement-breakpoint
CREATE TABLE `network_links` (
	`id` text PRIMARY KEY NOT NULL,
	`source_device_id` text NOT NULL,
	`source_interface` text,
	`destination_device_id` text,
	`destination_interface` text,
	`destination_hostname` text,
	`destination_ip` text,
	`discovery_protocol` text DEFAULT 'LLDP' NOT NULL,
	`confidence` text DEFAULT 'INFERRED' NOT NULL,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`source_device_id`) REFERENCES `network_devices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_device_id`) REFERENCES `network_devices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `network_links_source_idx` ON `network_links` (`source_device_id`);--> statement-breakpoint
CREATE INDEX `network_links_dest_idx` ON `network_links` (`destination_device_id`);--> statement-breakpoint
CREATE TABLE `network_scopes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cidr` text NOT NULL,
	`vlan_id` text,
	`enabled` integer DEFAULT true NOT NULL,
	`scan_interval_minutes` integer DEFAULT 60 NOT NULL,
	`last_scan_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `network_scopes_enabled_idx` ON `network_scopes` (`enabled`);--> statement-breakpoint
CREATE TABLE `snmp_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`version` text DEFAULT 'v2c' NOT NULL,
	`community` text,
	`security_level` text,
	`username` text,
	`auth_protocol` text,
	`auth_passphrase` text,
	`priv_protocol` text,
	`priv_passphrase` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `switch_ports` (
	`id` text PRIMARY KEY NOT NULL,
	`network_device_id` text NOT NULL,
	`interface_index` integer,
	`name` text NOT NULL,
	`description` text,
	`admin_status` text,
	`operational_status` text,
	`speed` integer,
	`mac_address` text,
	`access_vlan` integer,
	`native_vlan` integer,
	`trunk_mode` integer DEFAULT false,
	`last_updated_at` integer,
	FOREIGN KEY (`network_device_id`) REFERENCES `network_devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `switch_ports_device_idx` ON `switch_ports` (`network_device_id`);--> statement-breakpoint
CREATE INDEX `switch_ports_mac_idx` ON `switch_ports` (`mac_address`);--> statement-breakpoint
CREATE TABLE `vlans` (
	`id` text PRIMARY KEY NOT NULL,
	`vlan_number` integer NOT NULL,
	`name` text NOT NULL,
	`subnet` text,
	`cidr_prefix` integer,
	`gateway` text,
	`description` text,
	`site` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vlans_vlan_number_unique` ON `vlans` (`vlan_number`);--> statement-breakpoint
CREATE INDEX `vlans_number_idx` ON `vlans` (`vlan_number`);--> statement-breakpoint
CREATE TABLE `application_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`publisher` text,
	`application_version` text NOT NULL,
	`package_version` text DEFAULT '1' NOT NULL,
	`supported_operating_systems` text DEFAULT '["windows10","windows11"]' NOT NULL,
	`supported_architectures` text DEFAULT '["x64"]' NOT NULL,
	`installer_type` text NOT NULL,
	`installer_file_name` text NOT NULL,
	`installer_storage_path` text NOT NULL,
	`installer_arguments` text,
	`uninstall_arguments` text,
	`success_exit_codes` text DEFAULT '[0,3010]',
	`detection_type` text NOT NULL,
	`detection_rule` text NOT NULL,
	`sha256` text NOT NULL,
	`file_size` integer NOT NULL,
	`timeout_minutes` integer DEFAULT 120,
	`enabled` integer DEFAULT true NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `app_packages_name_idx` ON `application_packages` (`name`);--> statement-breakpoint
CREATE INDEX `app_packages_enabled_idx` ON `application_packages` (`enabled`);--> statement-breakpoint
CREATE TABLE `deployment_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`application_package_id` text NOT NULL,
	`created_by` text NOT NULL,
	`target_type` text NOT NULL,
	`target_definition` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`total_targets` integer DEFAULT 0 NOT NULL,
	`success_count` integer DEFAULT 0 NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`queued_count` integer DEFAULT 0 NOT NULL,
	`running_count` integer DEFAULT 0 NOT NULL,
	`cancelled_count` integer DEFAULT 0 NOT NULL,
	`scheduled_at` integer,
	`maintenance_window` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`application_package_id`) REFERENCES `application_packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `deployment_jobs_status_idx` ON `deployment_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `deployment_jobs_package_idx` ON `deployment_jobs` (`application_package_id`);--> statement-breakpoint
CREATE INDEX `deployment_jobs_created_idx` ON `deployment_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `deployment_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`deployment_job_id` text NOT NULL,
	`device_id` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`exit_code` integer,
	`error_code` text,
	`error_message` text,
	`diagnostics` text,
	`lease_token` text,
	`lease_expires_at` integer,
	`started_at` integer,
	`completed_at` integer,
	`last_attempt_at` integer,
	`next_attempt_at` integer,
	FOREIGN KEY (`deployment_job_id`) REFERENCES `deployment_jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deployment_targets_job_idx` ON `deployment_targets` (`deployment_job_id`);--> statement-breakpoint
CREATE INDEX `deployment_targets_device_idx` ON `deployment_targets` (`device_id`);--> statement-breakpoint
CREATE INDEX `deployment_targets_status_idx` ON `deployment_targets` (`status`);--> statement-breakpoint
CREATE INDEX `deployment_targets_lease_idx` ON `deployment_targets` (`lease_token`);--> statement-breakpoint
CREATE TABLE `device_group_members` (
	`group_id` text NOT NULL,
	`device_id` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `device_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `device_group_members_group_idx` ON `device_group_members` (`group_id`);--> statement-breakpoint
CREATE INDEX `device_group_members_device_idx` ON `device_group_members` (`device_id`);--> statement-breakpoint
CREATE TABLE `device_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`rules` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `device_groups_type_idx` ON `device_groups` (`type`);--> statement-breakpoint
CREATE TABLE `device_software` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`normalized_id` text NOT NULL,
	`name` text NOT NULL,
	`publisher` text,
	`version` text,
	`architecture` text DEFAULT 'x64' NOT NULL,
	`install_location` text,
	`product_code` text,
	`first_detected_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `device_software_device_idx` ON `device_software` (`device_id`);--> statement-breakpoint
CREATE INDEX `device_software_normalized_idx` ON `device_software` (`normalized_id`);--> statement-breakpoint
CREATE INDEX `device_software_name_idx` ON `device_software` (`name`);--> statement-breakpoint
CREATE TABLE `policy_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text NOT NULL,
	`package_id` text NOT NULL,
	`version_match` text DEFAULT 'ANY' NOT NULL,
	`required_version` text,
	FOREIGN KEY (`policy_id`) REFERENCES `software_policies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`package_id`) REFERENCES `application_packages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `policy_apps_policy_idx` ON `policy_applications` (`policy_id`);--> statement-breakpoint
CREATE TABLE `policy_compliance` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text NOT NULL,
	`device_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`last_evaluated_at` integer,
	`missing_packages` text,
	FOREIGN KEY (`policy_id`) REFERENCES `software_policies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `policy_compliance_policy_idx` ON `policy_compliance` (`policy_id`);--> statement-breakpoint
CREATE INDEX `policy_compliance_device_idx` ON `policy_compliance` (`device_id`);--> statement-breakpoint
CREATE INDEX `policy_compliance_status_idx` ON `policy_compliance` (`status`);--> statement-breakpoint
CREATE TABLE `software_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`normalized_name` text NOT NULL,
	`display_name` text NOT NULL,
	`publisher` text,
	`category` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `software_catalog_normalized_name_unique` ON `software_catalog` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `software_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_group_id` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`target_group_id`) REFERENCES `device_groups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `ad_computers` (
	`id` text PRIMARY KEY NOT NULL,
	`distinguished_name` text NOT NULL,
	`sam_account_name` text NOT NULL,
	`dns_hostname` text,
	`operating_system` text,
	`enabled` integer,
	`last_logon` integer,
	`when_created` integer,
	`organizational_unit` text,
	`correlated_device_id` text,
	`last_sync_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ad_computers_distinguished_name_unique` ON `ad_computers` (`distinguished_name`);--> statement-breakpoint
CREATE INDEX `ad_computers_sam_idx` ON `ad_computers` (`sam_account_name`);--> statement-breakpoint
CREATE INDEX `ad_computers_hostname_idx` ON `ad_computers` (`dns_hostname`);--> statement-breakpoint
CREATE INDEX `ad_computers_device_idx` ON `ad_computers` (`correlated_device_id`);--> statement-breakpoint
CREATE TABLE `ad_configuration` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`domain_fqdn` text,
	`ldap_endpoint` text,
	`use_ldaps` integer DEFAULT true NOT NULL,
	`base_dn` text,
	`computer_ou` text,
	`service_account_username` text,
	`connection_verified_at` integer,
	`enabled` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`user_id` text,
	`username_snapshot` text,
	`action` text NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`success` integer DEFAULT true NOT NULL,
	`source_ip` text,
	`user_agent` text,
	`metadata` text,
	`error_code` text
);
--> statement-breakpoint
CREATE INDEX `audit_logs_timestamp_idx` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE TABLE `domain_join_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`target_ou` text,
	`requested_by` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`error_message` text,
	`lease_token` text,
	`lease_expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `domain_join_jobs_device_idx` ON `domain_join_jobs` (`device_id`);--> statement-breakpoint
CREATE INDEX `domain_join_jobs_status_idx` ON `domain_join_jobs` (`status`);--> statement-breakpoint
CREATE TABLE `job_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`job_type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`priority` integer DEFAULT 5 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`error_message` text,
	`worker_id` text,
	`worker_heartbeat_at` integer,
	`scheduled_at` integer,
	`started_at` integer,
	`completed_at` integer,
	`next_attempt_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `job_queue_status_idx` ON `job_queue` (`status`);--> statement-breakpoint
CREATE INDEX `job_queue_type_idx` ON `job_queue` (`job_type`);--> statement-breakpoint
CREATE INDEX `job_queue_priority_idx` ON `job_queue` (`priority`,`status`);--> statement-breakpoint
CREATE INDEX `job_queue_scheduled_idx` ON `job_queue` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `job_queue_worker_idx` ON `job_queue` (`worker_id`);--> statement-breakpoint
CREATE TABLE `system_events` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`event` text NOT NULL,
	`device_id` text,
	`resource_type` text,
	`resource_id` text,
	`metadata` text,
	`severity` text DEFAULT 'INFO' NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `system_events_timestamp_idx` ON `system_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `system_events_event_idx` ON `system_events` (`event`);--> statement-breakpoint
CREATE INDEX `system_events_device_idx` ON `system_events` (`device_id`);--> statement-breakpoint
CREATE INDEX `system_events_severity_idx` ON `system_events` (`severity`);