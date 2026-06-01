ALTER TABLE `users` ADD `is_admin` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `devices` DROP COLUMN `is_shared`;