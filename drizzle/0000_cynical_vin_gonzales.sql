CREATE TABLE `feedback_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`raw_text` text NOT NULL,
	`sentiment` text,
	`urgency` text,
	`category` text,
	`created_at` text
);
