CREATE TABLE `device_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` integer NOT NULL,
	`state` text NOT NULL,
	`recorded_at` integer
);
