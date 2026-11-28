-- todos.agent_machine CHECK gets 'tservo' (Tambet's Omarchy PC, #268). SQLite rebuilds the
-- table to change a CHECK. Hand-edited: drizzle's rebuild (DROP TABLE todos) would cascade-delete
-- every comment, upload, label link, … of every card, as D1 cannot turn foreign keys off and
-- defer_foreign_keys does not stop cascades. So the rows go aside, and the old ids are moved out
-- of the way first: the 9 child FKs are ON UPDATE no action, so the UPDATE cascades nowhere,
-- and the DROP then deletes rows no child points at. Re-inserting the rows under their real ids
-- reconnects the children, so the deferred FK count is back at 0 before the commit.
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `todos_rows` AS SELECT * FROM `todos`;--> statement-breakpoint
UPDATE `todos` SET `id` = '~' || `id`;--> statement-breakpoint
DROP TABLE `todos`;--> statement-breakpoint
CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`list_id` text,
	`title` text NOT NULL,
	`content` text,
	`completed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`due_on` text,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`priority` text,
	`alias` text NOT NULL,
	`github_issue_number` integer,
	`github_issue_id` integer,
	`github_synced_at` text,
	`github_url` text,
	`min_hours` real,
	`max_hours` real,
	`actual_hours` real,
	`comment_hours` text,
	`has_time` integer DEFAULT false NOT NULL,
	`task_file_path` text,
	`agent_model` text,
	`agent_effort` text,
	`agent_machine` text,
	`agent_plan_first` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "todos_priority_check" CHECK("todos"."priority" IN ('low', 'medium', 'high')),
	CONSTRAINT "todos_agent_effort_check" CHECK("todos"."agent_effort" IN ('low', 'medium', 'high', 'xhigh', 'max')),
	CONSTRAINT "todos_agent_machine_check" CHECK("todos"."agent_machine" IN ('mac', 'karel', 'dell', 'windows', 'tservo', 'cloud'))
);
--> statement-breakpoint
INSERT INTO `todos`("id", "user_id", "list_id", "title", "content", "completed_at", "created_at", "updated_at", "due_on", "sort_order", "priority", "alias", "github_issue_number", "github_issue_id", "github_synced_at", "github_url", "min_hours", "max_hours", "actual_hours", "comment_hours", "has_time", "task_file_path", "agent_model", "agent_effort", "agent_machine", "agent_plan_first") SELECT "id", "user_id", "list_id", "title", "content", "completed_at", "created_at", "updated_at", "due_on", "sort_order", "priority", "alias", "github_issue_number", "github_issue_id", "github_synced_at", "github_url", "min_hours", "max_hours", "actual_hours", "comment_hours", "has_time", "task_file_path", "agent_model", "agent_effort", "agent_machine", "agent_plan_first" FROM `todos_rows`;--> statement-breakpoint
DROP TABLE `todos_rows`;--> statement-breakpoint
CREATE UNIQUE INDEX `todos_user_id_alias_key` ON `todos` (`user_id`,`alias`);--> statement-breakpoint
CREATE INDEX `todos_list_id_idx` ON `todos` (`list_id`);--> statement-breakpoint
CREATE INDEX `todos_github_issue_id_idx` ON `todos` (`github_issue_id`) WHERE "todos"."github_issue_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `todos_github_issue_number_idx` ON `todos` (`github_issue_number`) WHERE "todos"."github_issue_number" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `todos_task_file_path_idx` ON `todos` (`task_file_path`) WHERE "todos"."task_file_path" IS NOT NULL;--> statement-breakpoint
PRAGMA defer_foreign_keys = off;
