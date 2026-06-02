CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
ALTER TABLE `devices` ADD `threshold_min` real;--> statement-breakpoint
ALTER TABLE `devices` ADD `threshold_max` real;--> statement-breakpoint
ALTER TABLE `devices` ADD `threshold_enabled` integer DEFAULT false;