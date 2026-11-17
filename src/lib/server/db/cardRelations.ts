/** @file src/lib/server/db/cardRelations.ts */
// Drizzle relations for cards and what hangs off them (#256): the nested rows of Hasura's
// TodoFields, CommentFields, NotificationFields and ActivityLogFields fragments.
import { relations } from 'drizzle-orm';
import { activity_logs, notifications } from './schema/activity';
import { labels, lists } from './schema/boards';
import {
	comments,
	todo_assignees,
	todo_labels,
	todo_subscribers,
	todos,
	uploads
} from './schema/cards';
import { news } from './schema/extras';
import { users } from './schema/users';

export const todosRelations = relations(todos, ({ one, many }) => ({
	list: one(lists, { fields: [todos.list_id], references: [lists.id] }),
	assignees: many(todo_assignees),
	subscribers: many(todo_subscribers),
	labels: many(todo_labels),
	uploads: many(uploads)
}));

export const todoAssigneesRelations = relations(todo_assignees, ({ one }) => ({
	todo: one(todos, { fields: [todo_assignees.todo_id], references: [todos.id] }),
	assignee: one(users, { fields: [todo_assignees.user_id], references: [users.id] })
}));

export const todoSubscribersRelations = relations(todo_subscribers, ({ one }) => ({
	todo: one(todos, { fields: [todo_subscribers.todo_id], references: [todos.id] }),
	subscriber: one(users, { fields: [todo_subscribers.user_id], references: [users.id] })
}));

export const todoLabelsRelations = relations(todo_labels, ({ one }) => ({
	todo: one(todos, { fields: [todo_labels.todo_id], references: [todos.id] }),
	label: one(labels, { fields: [todo_labels.label_id], references: [labels.id] })
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
	todo: one(todos, { fields: [uploads.todo_id], references: [todos.id] })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
	todo: one(todos, { fields: [comments.todo_id], references: [todos.id] }),
	user: one(users, { fields: [comments.user_id], references: [users.id] })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	todo: one(todos, { fields: [notifications.todo_id], references: [todos.id] }),
	triggered_by_user: one(users, {
		fields: [notifications.triggered_by_user_id],
		references: [users.id]
	}),
	news: one(news, { fields: [notifications.related_news_id], references: [news.id] })
}));

export const activityLogsRelations = relations(activity_logs, ({ one }) => ({
	todo: one(todos, { fields: [activity_logs.todo_id], references: [todos.id] }),
	user: one(users, { fields: [activity_logs.user_id], references: [users.id] })
}));
