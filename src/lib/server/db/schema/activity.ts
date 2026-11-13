/** @file src/lib/server/db/schema/activity.ts */
// Card activity, notifications and logs: the most-written tables, so few indexes
// (Postgres had 5 on activity_logs, 5 on logs and 7 on notifications; now 1, 2 and 1).
import { sql } from 'drizzle-orm';
import { check, index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { comments, todos } from './cards';
import { bool, createdAt, id, json, updatedAt } from './columns';
import { news } from './extras';
import { users } from './users';

const ACTIONS = [
	'created',
	'updated',
	'deleted',
	'completed',
	'uncompleted',
	'assigned',
	'unassigned',
	'commented',
	'comment_edited',
	'comment_deleted',
	'image_added',
	'image_removed',
	'priority_changed',
	'due_date_changed',
	'list_moved',
	'title_changed',
	'content_updated',
	'hours_changed',
	'github_commit'
];

const NOTIFICATION_TYPES = [
	'assigned',
	'commented',
	'edited',
	'image_added',
	'image_removed',
	'comment_edited',
	'comment_removed',
	'priority_changed',
	'news'
];

const oneOf = (values: string[]) => sql.raw(values.map((v) => `'${v}'`).join(', '));

export const activity_logs = sqliteTable(
	'activity_logs',
	{
		id: id(),
		user_id: text().references(() => users.id, { onDelete: 'set null' }),
		todo_id: text()
			.notNull()
			.references(() => todos.id, { onDelete: 'cascade' }),
		action_type: text().notNull(),
		field_name: text(),
		old_value: text(),
		new_value: text(),
		changes: json(),
		created_at: createdAt()
	},
	(t) => [
		// A card's history, newest first; a board's history walks its cards.
		index('activity_logs_todo_created_idx').on(t.todo_id, t.created_at),
		check('activity_logs_action_type_check', sql`${t.action_type} IN (${oneOf(ACTIONS)})`)
	]
);

export const notifications = sqliteTable(
	'notifications',
	{
		id: id(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		todo_id: text().references(() => todos.id, { onDelete: 'cascade' }),
		type: text().notNull(),
		triggered_by_user_id: text().references(() => users.id, { onDelete: 'set null' }),
		related_comment_id: text().references(() => comments.id, { onDelete: 'cascade' }),
		content: text(),
		is_read: bool().notNull().default(false),
		created_at: createdAt(),
		updated_at: updatedAt(),
		related_news_id: text().references(() => news.id, { onDelete: 'cascade' })
	},
	(t) => [
		// The 30 s poll counts a user's unread ones; the list reads a user's.
		index('notifications_user_read_idx').on(t.user_id, t.is_read),
		check('notifications_type_check', sql`${t.type} IN (${oneOf(NOTIFICATION_TYPES)})`),
		check(
			'notifications_no_self_notify',
			sql`${t.triggered_by_user_id} IS NULL OR ${t.user_id} <> ${t.triggered_by_user_id}`
		)
	]
);

/** Client and server logs, kept 30 days. One timestamp: `created_at` is the event time
 * (Postgres had `timestamp` and `created_at`). */
export const logs = sqliteTable(
	'logs',
	{
		id: id(),
		level: text().notNull(),
		component: text().notNull(),
		message: text().notNull(),
		data: json(),
		user_id: text().references(() => users.id, { onDelete: 'set null' }),
		session_id: text(),
		user_agent: text(),
		url: text(),
		created_at: createdAt()
	},
	(t) => [
		// The logs page (a user's, newest first) and the 30-day prune.
		index('logs_user_created_idx').on(t.user_id, t.created_at),
		index('logs_created_at_idx').on(t.created_at),
		check('logs_level_check', sql`${t.level} IN ('debug', 'info', 'warn', 'error')`)
	]
);
