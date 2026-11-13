CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	`oauth_token` text,
	`oauth_token_secret` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_key` ON `accounts` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE TABLE `user_secrets` (
	`user_id` text PRIMARY KEY NOT NULL,
	`tokens` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` text,
	`image` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`locale` text DEFAULT 'et' NOT NULL,
	`dark_mode` integer DEFAULT true NOT NULL,
	`settings` text DEFAULT '{"defaultView":"kanban"}' NOT NULL,
	`username` text NOT NULL,
	`default_labels` text DEFAULT '[]',
	`password` text,
	`invoice_from_details` text,
	`plan` text DEFAULT 'free' NOT NULL,
	`plan_expires_at` text,
	`stripe_customer_id` text,
	`claude_plan` text,
	`claude_plan_monthly` real,
	`claude_plan_currency` text DEFAULT 'EUR',
	CONSTRAINT "users_plan_check" CHECK("users"."plan" IN ('free', 'paid')),
	CONSTRAINT "users_claude_plan_check" CHECK("users"."claude_plan" IN ('api', 'pro', 'max5x', 'max20x'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE TABLE `board_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`inviter_id` text NOT NULL,
	`invitee_email` text,
	`invitee_username` text,
	`role` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`token` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`expires_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+7 days')) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "board_invitations_role_check" CHECK("board_invitations"."role" IN ('editor', 'viewer')),
	CONSTRAINT "board_invitations_status_check" CHECK("board_invitations"."status" IN ('pending', 'accepted', 'declined', 'cancelled')),
	CONSTRAINT "board_invitations_invitee_check" CHECK("board_invitations"."invitee_email" IS NOT NULL OR "board_invitations"."invitee_username" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `board_invitations_token_unique` ON `board_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `board_invitations_board_id_idx` ON `board_invitations` (`board_id`);--> statement-breakpoint
CREATE INDEX `board_invitations_invitee_email_idx` ON `board_invitations` (`invitee_email`);--> statement-breakpoint
CREATE INDEX `board_invitations_invitee_username_idx` ON `board_invitations` (`invitee_username`);--> statement-breakpoint
CREATE TABLE `board_members` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "board_members_role_check" CHECK("board_members"."role" IN ('owner', 'editor', 'viewer'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `board_members_board_user_key` ON `board_members` (`board_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `board_members_user_id_idx` ON `board_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`alias` text NOT NULL,
	`github_repo` text,
	`is_public` integer DEFAULT false NOT NULL,
	`allow_public_comments` integer DEFAULT false NOT NULL,
	`settings` text DEFAULT '{"enable_hour_tracking":false}' NOT NULL,
	`customer_invoice_details` text,
	`archived_at` text,
	`client_id` text,
	`changed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boards_alias_unique` ON `boards` (`alias`);--> statement-breakpoint
CREATE INDEX `boards_user_id_idx` ON `boards` (`user_id`);--> statement-breakpoint
CREATE INDEX `boards_github_repo_idx` ON `boards` (`github_repo`) WHERE "boards"."github_repo" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `labels` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `labels_board_id_idx` ON `labels` (`board_id`);--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`board_id` text,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lists_board_id_idx` ON `lists` (`board_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`todo_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	`github_comment_id` integer,
	`github_synced_at` text,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_todo_id_idx` ON `comments` (`todo_id`);--> statement-breakpoint
CREATE INDEX `comments_github_comment_id_idx` ON `comments` (`github_comment_id`) WHERE "comments"."github_comment_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `todo_assignees` (
	`todo_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`todo_id`, `user_id`),
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `todo_labels` (
	`todo_id` text NOT NULL,
	`label_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	PRIMARY KEY(`todo_id`, `label_id`),
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `todo_subscribers` (
	`todo_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`todo_id`, `user_id`),
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
	CONSTRAINT "todos_agent_machine_check" CHECK("todos"."agent_machine" IN ('mac', 'karel', 'dell', 'windows', 'cloud'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `todos_user_id_alias_key` ON `todos` (`user_id`,`alias`);--> statement-breakpoint
CREATE INDEX `todos_list_id_idx` ON `todos` (`list_id`);--> statement-breakpoint
CREATE INDEX `todos_github_issue_id_idx` ON `todos` (`github_issue_id`) WHERE "todos"."github_issue_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `todos_github_issue_number_idx` ON `todos` (`github_issue_number`) WHERE "todos"."github_issue_number" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`todo_id` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `uploads_todo_id_idx` ON `uploads` (`todo_id`);--> statement-breakpoint
CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`todo_id` text NOT NULL,
	`action_type` text NOT NULL,
	`field_name` text,
	`old_value` text,
	`new_value` text,
	`changes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "activity_logs_action_type_check" CHECK("activity_logs"."action_type" IN ('created', 'updated', 'deleted', 'completed', 'uncompleted', 'assigned', 'unassigned', 'commented', 'comment_edited', 'comment_deleted', 'image_added', 'image_removed', 'priority_changed', 'due_date_changed', 'list_moved', 'title_changed', 'content_updated', 'hours_changed', 'github_commit'))
);
--> statement-breakpoint
CREATE INDEX `activity_logs_todo_created_idx` ON `activity_logs` (`todo_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`component` text NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`user_id` text,
	`session_id` text,
	`user_agent` text,
	`url` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "logs_level_check" CHECK("logs"."level" IN ('debug', 'info', 'warn', 'error'))
);
--> statement-breakpoint
CREATE INDEX `logs_user_created_idx` ON `logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`todo_id` text,
	`type` text NOT NULL,
	`triggered_by_user_id` text,
	`related_comment_id` text,
	`content` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`related_news_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`triggered_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`related_comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "notifications_type_check" CHECK("notifications"."type" IN ('assigned', 'commented', 'edited', 'image_added', 'image_removed', 'comment_edited', 'comment_removed', 'priority_changed', 'news')),
	CONSTRAINT "notifications_no_self_notify" CHECK("notifications"."triggered_by_user_id" IS NULL OR "notifications"."user_id" <> "notifications"."triggered_by_user_id")
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE TABLE `note_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `note_uploads_note_id_idx` ON `note_uploads` (`note_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT 'Untitled Note' NOT NULL,
	`content` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`cover_image_url` text,
	`parent_id` text,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notes_board_id_idx` ON `notes` (`board_id`);--> statement-breakpoint
CREATE INDEX `notes_parent_id_idx` ON `notes` (`parent_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`company_name` text,
	`email` text,
	`phone` text,
	`address` text,
	`vat_number` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`default_rate` real,
	`notes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`linked_user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`linked_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `clients_user_id_idx` ON `clients` (`user_id`);--> statement-breakpoint
CREATE TABLE `expense_splits` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `expense_splits_expense_id_idx` ON `expense_splits` (`expense_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`created_by` text NOT NULL,
	`board_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`deleted_at` text,
	`description` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expenses_board_id_idx` ON `expenses` (`board_id`);--> statement-breakpoint
CREATE TABLE `invoice_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`vat_number` text,
	`vat_rate` real DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`iban` text,
	`swift` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invoice_companies_user_id_idx` ON `invoice_companies` (`user_id`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`todo_id` text,
	`title` text NOT NULL,
	`hours` real DEFAULT 0 NOT NULL,
	`hourly_rate` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`board_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`issued_date` text DEFAULT (date('now')) NOT NULL,
	`due_date` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`hourly_rate` real DEFAULT 0 NOT NULL,
	`total_hours` real DEFAULT 0 NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`custom_fields` text DEFAULT '[]' NOT NULL,
	`company_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `invoice_companies`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "invoices_status_check" CHECK("invoices"."status" IN ('draft', 'sent', 'paid', 'cancelled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_user_number_key` ON `invoices` (`user_id`,`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_board_id_idx` ON `invoices` (`board_id`);--> statement-breakpoint
CREATE TABLE `claude_model_pricing` (
	`model` text PRIMARY KEY NOT NULL,
	`input_per_mtok` real NOT NULL,
	`output_per_mtok` real NOT NULL,
	`cache_write_per_mtok` real,
	`cache_read_per_mtok` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`source` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `claude_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`todo_id` text,
	`user_id` text NOT NULL,
	`repo` text,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cache_read_tokens` integer DEFAULT 0 NOT NULL,
	`cache_write_tokens` integer DEFAULT 0 NOT NULL,
	`usage_by_model` text,
	`cost_usd` real DEFAULT 0 NOT NULL,
	`started_at` text,
	`ended_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`todo_id`) REFERENCES `todos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claude_usage_session_id_unique` ON `claude_usage` (`session_id`);--> statement-breakpoint
CREATE INDEX `claude_usage_todo_id_idx` ON `claude_usage` (`todo_id`);--> statement-breakpoint
CREATE INDEX `claude_usage_user_created_idx` ON `claude_usage` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `news` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user_id_idx` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `url_shortcuts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`alias` text NOT NULL,
	`target_url` text NOT NULL,
	`visit_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `url_shortcuts_alias_unique` ON `url_shortcuts` (`alias`);--> statement-breakpoint
CREATE INDEX `url_shortcuts_user_id_idx` ON `url_shortcuts` (`user_id`);