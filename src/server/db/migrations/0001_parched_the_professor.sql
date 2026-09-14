CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`category` text DEFAULT 'SYSTEM' NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`severity` text DEFAULT 'INFO' NOT NULL,
	`href` text,
	`read` integer DEFAULT false NOT NULL,
	`read_at` integer,
	`dismissed` integer DEFAULT false NOT NULL,
	`dismissed_at` integer,
	`source_event_id` text,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_created_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`read`);--> statement-breakpoint
CREATE INDEX `notifications_dismissed_idx` ON `notifications` (`dismissed`);--> statement-breakpoint
CREATE INDEX `notifications_category_idx` ON `notifications` (`category`);--> statement-breakpoint
CREATE INDEX `notifications_source_idx` ON `notifications` (`source_event_id`);