CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`manage_token` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`duration` integer NOT NULL,
	`price` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`source` text DEFAULT 'online' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_manage_token_unique` ON `appointments` (`manage_token`);--> statement-breakpoint
CREATE TABLE `owner_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedule_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`label` text NOT NULL,
	`all_day` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`duration` integer NOT NULL,
	`price` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
