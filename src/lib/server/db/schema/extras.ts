/** @file src/lib/server/db/schema/extras.ts */
// Claude usage, short links, push subscriptions and news.
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { todos } from './cards';
import { createdAt, id, json, updatedAt } from './columns';
import { users } from './users';

export const claude_model_pricing = sqliteTable('claude_model_pricing', {
	model: text().primaryKey(),
	input_per_mtok: real().notNull(),
	output_per_mtok: real().notNull(),
	cache_write_per_mtok: real(),
	cache_read_per_mtok: real(),
	currency: text().notNull().default('USD'),
	source: text(),
	updated_at: updatedAt()
});

export const claude_usage = sqliteTable(
	'claude_usage',
	{
		id: id(),
		session_id: text().notNull().unique(),
		todo_id: text().references(() => todos.id, { onDelete: 'set null' }),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		repo: text(),
		model: text().notNull(),
		input_tokens: integer().notNull().default(0),
		output_tokens: integer().notNull().default(0),
		cache_read_tokens: integer().notNull().default(0),
		cache_write_tokens: integer().notNull().default(0),
		usage_by_model: json(),
		cost_usd: real().notNull().default(0),
		started_at: text(),
		ended_at: text(),
		created_at: createdAt()
	},
	(t) => [
		// The board load sums cost per card; the usage page reads a user's by date.
		index('claude_usage_todo_id_idx').on(t.todo_id),
		index('claude_usage_user_created_idx').on(t.user_id, t.created_at)
	]
);

export const url_shortcuts = sqliteTable(
	'url_shortcuts',
	{
		id: id(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		alias: text().notNull().unique(),
		target_url: text().notNull(),
		visit_count: integer().notNull().default(0),
		created_at: createdAt(),
		updated_at: updatedAt()
	},
	(t) => [index('url_shortcuts_user_id_idx').on(t.user_id)]
);

export const push_subscriptions = sqliteTable(
	'push_subscriptions',
	{
		id: id(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		endpoint: text().notNull().unique(),
		p256dh: text().notNull(),
		auth: text().notNull(),
		created_at: createdAt()
	},
	(t) => [index('push_subscriptions_user_id_idx').on(t.user_id)]
);

export const news = sqliteTable('news', {
	id: id(),
	title: text().notNull(),
	body: text().notNull(),
	url: text(),
	created_by: text().references(() => users.id, { onDelete: 'set null' }),
	created_at: createdAt()
});
