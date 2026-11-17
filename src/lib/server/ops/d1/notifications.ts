/** @file src/lib/server/ops/d1/notifications.ts */
// The bell and the board's activity feed on D1, with the same rules as
// ops/notifications.ts and ops/activity.ts: a user's own notifications, a board's members.
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { isMember, requireRole } from '$lib/server/access';
import { activity_logs, lists, notifications, todos } from '$lib/server/db/schema';
import { inList } from './sql';
import type { D1Run } from './types';

const person = { columns: { id: true, name: true, username: true, image: true } } as const;

export const getNotifications: D1Run<'getNotifications'> = async (
	{ d1, userId },
	{ limit, offset }
) =>
	d1.query.notifications.findMany({
		where: eq(notifications.user_id, userId),
		orderBy: [desc(notifications.created_at), asc(notifications.id)],
		limit,
		offset,
		columns: { related_news_id: false },
		with: {
			triggered_by_user: person,
			news: { columns: { id: true, title: true, body: true, url: true } },
			todo: {
				columns: { id: true, title: true },
				with: {
					list: {
						columns: { id: true },
						with: {
							board: {
								columns: { id: true, name: true, alias: true },
								with: { user: { columns: { id: true, username: true } } }
							}
						}
					}
				}
			}
		}
	});

export const markNotificationsRead: D1Run<'markNotificationsRead'> = async (
	{ d1, userId },
	{ ids }
) => {
	const result = await d1
		.update(notifications)
		.set({ is_read: true })
		.where(and(eq(notifications.user_id, userId), inList(notifications.id, ids)));
	return { updated: result.meta.changes };
};

export const deleteNotification: D1Run<'deleteNotification'> = async ({ d1, userId }, { id }) => {
	const result = await d1
		.delete(notifications)
		.where(and(eq(notifications.user_id, userId), eq(notifications.id, id)));
	return { deleted: result.meta.changes > 0 };
};

export const getBoardActivity: D1Run<'getBoardActivity'> = async (
	ctx,
	{ boardId, limit, offset }
) => {
	await requireRole(ctx, boardId, isMember);
	const { d1 } = ctx;
	const cards = d1
		.select({ id: todos.id })
		.from(todos)
		.innerJoin(lists, eq(lists.id, todos.list_id))
		.where(eq(lists.board_id, boardId));
	return d1.query.activity_logs.findMany({
		where: inArray(activity_logs.todo_id, cards),
		orderBy: [desc(activity_logs.created_at), asc(activity_logs.id)],
		limit,
		offset,
		with: {
			user: person,
			todo: {
				columns: { id: true, alias: true, title: true },
				with: {
					list: {
						columns: { id: true, name: true },
						with: { board: { columns: { id: true, name: true, alias: true } } }
					}
				}
			}
		}
	});
};
