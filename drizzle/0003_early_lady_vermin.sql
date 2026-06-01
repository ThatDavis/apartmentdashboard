CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`days_of_week` text DEFAULT '1,2,3,4,5,6,7' NOT NULL,
	`enabled` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `twilight_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`dawn` text NOT NULL,
	`dusk` text NOT NULL,
	`sunrise` text NOT NULL,
	`sunset` text NOT NULL,
	`fetched_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `twilight_cache_date_unique` ON `twilight_cache` (`date`);