/** @file src/lib/server/db/schema/cards.ts */
// Cards and what hangs off them. Changes from Postgres: `todos.assigned_to` is folded
// into `todo_assignees` (one assignee model), `todos.invoiced_hours` (always 0) is gone,
// and `todos.list_id` / `uploads.todo_id` get the indexes the board load needs.
// `content_preview` is not a column: it is `substr(content, 1, 150)` in the query.
import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { labels, lists } from './boards';
import { bool, createdAt, id, NOW, updatedAt } from './columns';
import { users } from './users';

export const todos = sqliteTable(
	'todos',
	{
		id: id(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		list_id: text().references(() => lists.id, { onDelete: 'cascade' }),
		title: text().notNull(),
		content: text(),
		completed_at: text(),
		created_at: createdAt(),
		updated_at: updatedAt(),
		due_on: text(),
		sort_order: integer().notNull().default(1),
		priority: text(),
		alias: text().notNull(),
		github_issue_number: integer(),
		github_issue_id: integer(),
		github_synced_at: text(),
		github_url: text(),
		min_hours: real(),
		max_hours: real(),
		actual_hours: real(),
		comment_hours: text(),
		has_time: bool().notNull().default(false),
		task_file_path: text(),
		agent_model: text(),
		agent_effort: text(),
		agent_machine: text(),
		agent_plan_first: bool().notNull().default(false)
	},
	(t) => [
		// Card URLs: aliases are unique per user.
		uniqueIndex('todos_user_id_alias_key').on(t.user_id, t.alias),
		index('todos_list_id_idx').on(t.list_id),
		// GitHub webhook lookups; partial, so cards without an issue cost no index row.
		index('todos_github_issue_id_idx')
			.on(t.github_issue_id)
			.where(sql`${t.github_issue_id} IS NOT NULL`),
		index('todos_github_issue_number_idx')
			.on(t.github_issue_number)
			.where(sql`${t.github_issue_number} IS NOT NULL`),
		check('todos_priority_check', sql`${t.priority} IN ('low', 'medium', 'high')`),
		check(
			'todos_agent_effort_check',
			sql`${t.agent_effort} IN ('low', 'medium', 'high', 'xhigh', 'max')`
		),
		check(
			'todos_agent_machine_check',
			sql`${t.agent_machine} IN ('mac', 'karel', 'dell', 'windows', 'cloud')`
		)
	]
);

const todoRef = () =>
	text()
		.notNull()
		.references(() => todos.id, { onDelete: 'cascade' });
const userRef = () =>
	text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' });

export const todo_assignees = sqliteTable(
	'todo_assignees',
	{ todo_id: todoRef(), user_id: userRef(), created_at: createdAt() },
	(t) => [primaryKey({ columns: [t.todo_id, t.user_id] })]
);

export const todo_subscribers = sqliteTable(
	'todo_subscribers',
	{ todo_id: todoRef(), user_id: userRef(), created_at: createdAt() },
	(t) => [primaryKey({ columns: [t.todo_id, t.user_id] })]
);

export const todo_labels = sqliteTable(
	'todo_labels',
	{
		todo_id: todoRef(),
		label_id: text()
			.notNull()
			.references(() => labels.id, { onDelete: 'cascade' }),
		created_at: text().default(NOW)
	},
	(t) => [primaryKey({ columns: [t.todo_id, t.label_id] })]
);

export const comments = sqliteTable(
	'comments',
	{
		id: id(),
		todo_id: todoRef(),
		user_id: userRef(),
		content: text().notNull(),
		created_at: text().default(NOW),
		updated_at: text().default(NOW),
		github_comment_id: integer(),
		github_synced_at: text()
	},
	(t) => [
		index('comments_todo_id_idx').on(t.todo_id),
		index('comments_github_comment_id_idx')
			.on(t.github_comment_id)
			.where(sql`${t.github_comment_id} IS NOT NULL`)
	]
);

export const uploads = sqliteTable(
	'uploads',
	{ id: id(), todo_id: todoRef(), url: text().notNull(), created_at: createdAt() },
	(t) => [index('uploads_todo_id_idx').on(t.todo_id)]
);
