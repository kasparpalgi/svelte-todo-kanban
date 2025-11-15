import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import {
	GET_NOTIFICATIONS,
	CREATE_NOTIFICATION,
	UPDATE_NOTIFICATION,
	MARK_NOTIFICATIONS_AS_READ,
	DELETE_NOTIFICATION
} from '$lib/graphql/documents';
import type {
	GetNotificationsQuery,
	CreateNotificationMutation,
	UpdateNotificationMutation,
	MarkNotificationsAsReadMutation,
	DeleteNotificationMutation,
	Notifications_Insert_Input
} from '$lib/graphql/generated/graphql';

export interface NotificationState {
	notifications: Array<any>;
	loading: boolean;
	error: string | null;
	unreadCount: number;
}

function createNotificationStore() {
	const state = $state<NotificationState>({
		notifications: [],
		loading: false,
		error: null,
		unreadCount: 0
	});

	async function loadNotifications(userId: string, limit = 50, offset = 0) {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.loading = true;
		state.error = null;
		try {
			const data = (await request(GET_NOTIFICATIONS, {
				where: { user_id: { _eq: userId } },
				order_by: [{ created_at: 'desc' }],
				limit,
				offset
			})) as GetNotificationsQuery;

			state.notifications = data.notifications || [];
			state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
			return { success: true, message: 'Notifications loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	async function createNotification(notification: Notifications_Insert_Input) {
		if (!browser) return { success: false, message: 'Not in browser', data: null };

		try {
			const data = (await request(CREATE_NOTIFICATION, {
				notification
			})) as CreateNotificationMutation;

			const newNotification = data.insert_notifications_one;
			if (newNotification) {
				state.notifications.unshift(newNotification);
				if (!newNotification.is_read) {
					state.unreadCount++;
				}
				return { success: true, message: 'Notification created', data: newNotification };
			}
			return { success: false, message: 'Failed to create notification' };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return { success: false, message };
		}
	}

	async function markAsRead(notificationId: string) {
		if (!browser) return { success: false, message: 'Not in browser' };

		const index = state.notifications.findIndex((n) => n.id === notificationId);
		if (index === -1) return { success: false, message: 'Notification not found' };

		const original = { ...state.notifications[index] };
		const wasUnread = !original.is_read;

		// Optimistic update
		state.notifications[index] = { ...original, is_read: true };
		if (wasUnread) state.unreadCount--;

		try {
			const data = (await request(UPDATE_NOTIFICATION, {
				id: notificationId,
				updates: { is_read: true }
			})) as UpdateNotificationMutation;

			const updated = data.update_notifications_by_pk;
			if (updated) {
				state.notifications[index] = updated;
				return { success: true, message: 'Marked as read' };
			}
			return { success: false, message: 'Update failed' };
		} catch (error) {
			// Rollback
			state.notifications[index] = original;
			if (wasUnread) state.unreadCount++;

			const message = error instanceof Error ? error.message : String(error);
			return { success: false, message };
		}
	}

	async function markMultipleAsRead(notificationIds: string[]) {
		if (!browser) return { success: false, message: 'Not in browser' };

		const originalMap = new Map(state.notifications.map((n) => [n.id, { ...n }]));
		let decremented = 0;

		// Optimistic update
		for (const id of notificationIds) {
			const idx = state.notifications.findIndex((n) => n.id === id);
			if (idx !== -1 && !state.notifications[idx].is_read) {
				state.notifications[idx] = { ...state.notifications[idx], is_read: true };
				decremented++;
			}
		}
		state.unreadCount -= decremented;

		try {
			const data = (await request(MARK_NOTIFICATIONS_AS_READ, {
				notification_ids: notificationIds
			})) as MarkNotificationsAsReadMutation;

			return { success: true, message: `Marked ${notificationIds.length} as read` };
		} catch (error) {
			// Rollback
			for (const id of notificationIds) {
				const original = originalMap.get(id);
				const idx = state.notifications.findIndex((n) => n.id === id);
				if (idx !== -1 && original) {
					state.notifications[idx] = original;
				}
			}
			state.unreadCount += decremented;

			const message = error instanceof Error ? error.message : String(error);
			return { success: false, message };
		}
	}

	async function deleteNotification(notificationId: string) {
		if (!browser) return { success: false, message: 'Not in browser' };

		const index = state.notifications.findIndex((n) => n.id === notificationId);
		if (index === -1) return { success: false, message: 'Notification not found' };

		const original = state.notifications[index];
		const wasUnread = !original.is_read;

		// Optimistic delete
		state.notifications.splice(index, 1);
		if (wasUnread) state.unreadCount--;

		try {
			await request(DELETE_NOTIFICATION, { id: notificationId }) as DeleteNotificationMutation;
			return { success: true, message: 'Notification deleted' };
		} catch (error) {
			// Rollback
			state.notifications.splice(index, 0, original);
			if (wasUnread) state.unreadCount++;

			const message = error instanceof Error ? error.message : String(error);
			return { success: false, message };
		}
	}

	return {
		get notifications() {
			return state.notifications;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get unreadCount() {
			return state.unreadCount;
		},
		loadNotifications,
		createNotification,
		markAsRead,
		markMultipleAsRead,
		deleteNotification
	};
}

export const notificationStore = createNotificationStore();
