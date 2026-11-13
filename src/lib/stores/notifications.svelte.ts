/** @file src/lib/stores/notifications.svelte.ts */
// The bell's notifications, through the data API (#229). The browser no longer creates
// any: the ops that cause one (a comment, an assignment) write it on the server.
import { browser } from '$app/environment';
import { call, type OpOutput } from '$lib/api/call';

type Notification = OpOutput<'getNotifications'>[number];

interface NotificationState {
	notifications: Notification[];
	loading: boolean;
	error: string | null;
	unreadCount: number;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function createNotificationStore() {
	const state = $state<NotificationState>({
		notifications: [],
		loading: false,
		error: null,
		unreadCount: 0
	});

	// The caller's own notifications; the server takes the user from the session.
	async function loadNotifications(_userId?: string, limit = 50, offset = 0) {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.loading = true;
		state.error = null;
		try {
			state.notifications = await call('getNotifications', { limit, offset });
			state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
			return { success: true, message: 'Notifications loaded' };
		} catch (error) {
			state.error = errorMessage(error);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	/** Marks these as read, optimistically; puts them back if the server refuses. */
	async function markMultipleAsRead(notificationIds: string[]) {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (notificationIds.length === 0) return { success: true, message: 'Nothing to mark' };

		const ids = new Set(notificationIds);
		const original = state.notifications;
		const flipped = original.filter((n) => ids.has(n.id) && !n.is_read).length;
		state.notifications = original.map((n) => (ids.has(n.id) ? { ...n, is_read: true } : n));
		state.unreadCount -= flipped;

		try {
			await call('markNotificationsRead', { ids: notificationIds });
			return { success: true, message: `Marked ${notificationIds.length} as read` };
		} catch (error) {
			state.notifications = original;
			state.unreadCount += flipped;
			return { success: false, message: errorMessage(error) };
		}
	}

	async function markAsRead(notificationId: string) {
		if (!state.notifications.some((n) => n.id === notificationId)) {
			return { success: false, message: 'Notification not found' };
		}
		return markMultipleAsRead([notificationId]);
	}

	async function deleteNotification(notificationId: string) {
		if (!browser) return { success: false, message: 'Not in browser' };

		const original = state.notifications;
		const target = original.find((n) => n.id === notificationId);
		if (!target) return { success: false, message: 'Notification not found' };

		state.notifications = original.filter((n) => n.id !== notificationId);
		if (!target.is_read) state.unreadCount--;

		try {
			await call('deleteNotification', { id: notificationId });
			return { success: true, message: 'Notification deleted' };
		} catch (error) {
			state.notifications = original;
			if (!target.is_read) state.unreadCount++;
			return { success: false, message: errorMessage(error) };
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
		markAsRead,
		markMultipleAsRead,
		deleteNotification
	};
}

export const notificationStore = createNotificationStore();
