/** @file src/lib/server/ops/notifications.ts */
// The bell: the caller's own notifications only. Nobody creates one from the browser
// any more; the ops that cause them write them (#229).
import { z } from 'zod';
import {
	DELETE_MY_NOTIFICATION,
	GET_NOTIFICATIONS,
	MARK_MY_NOTIFICATIONS_READ
} from '$lib/graphql/documents';
import { Order_By } from '$lib/graphql/generated/graphql';
import { defineOp } from './op';

export const getNotifications = defineOp({
	auth: 'user',
	input: z.object({
		limit: z.number().int().min(1).max(200).default(50),
		offset: z.number().int().min(0).default(0)
	}),
	async run({ db, userId }, { limit, offset }) {
		const data = await db(GET_NOTIFICATIONS, {
			where: { user_id: { _eq: userId } },
			order_by: [{ created_at: Order_By.Desc }],
			limit,
			offset
		});
		return data.notifications;
	}
});

export const markNotificationsRead = defineOp({
	auth: 'user',
	input: z.object({ ids: z.array(z.guid()).min(1).max(500) }),
	async run({ db, userId }, { ids }) {
		const data = await db(MARK_MY_NOTIFICATIONS_READ, { userId, ids });
		return { updated: data.update_notifications?.affected_rows ?? 0 };
	}
});

export const deleteNotification = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run({ db, userId }, { id }) {
		const data = await db(DELETE_MY_NOTIFICATION, { userId, id });
		return { deleted: (data.delete_notifications?.affected_rows ?? 0) > 0 };
	}
});
