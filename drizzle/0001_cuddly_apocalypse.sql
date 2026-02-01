PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_feedback_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text,
	`raw_text` text NOT NULL,
	`sentiment` text,
	`urgency` text,
	`category` text,
	`created_at` text
);
--> statement-breakpoint
INSERT INTO `__new_feedback_entries`("id", "source", "raw_text", "sentiment", "urgency", "category", "created_at") SELECT "id", "source", "raw_text", "sentiment", "urgency", "category", "created_at" FROM `feedback_entries`;--> statement-breakpoint
DROP TABLE `feedback_entries`;--> statement-breakpoint
ALTER TABLE `__new_feedback_entries` RENAME TO `feedback_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;