-- user_secrets: one row per secret instead of one JSON blob per user (#232, after #230).
-- Hand-edited: the old rows were copies, so drop and refill them with
-- `node scripts/d1/copy-from-postgres.mjs user_secrets --remote`.
DROP TABLE `user_secrets`;--> statement-breakpoint
CREATE TABLE `user_secrets` (
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`user_id`, `name`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
