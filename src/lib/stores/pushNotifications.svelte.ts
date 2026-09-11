/** @file src/lib/stores/pushNotifications.svelte.ts */
import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
import { CREATE_PUSH_SUBSCRIPTION, DELETE_PUSH_SUBSCRIPTION } from '$lib/graphql/documents';

export interface PushNotificationState {
	supported: boolean;
	permission: NotificationPermission | 'unsupported';
	subscribed: boolean;
	loading: boolean;
	error: string | null;
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0))).buffer as ArrayBuffer;
}

function createPushNotificationStore() {
	const supported =
		browser && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

	const state = $state<PushNotificationState>({
		supported,
		permission: supported ? Notification.permission : 'unsupported',
		subscribed: false,
		loading: false,
		error: null
	});

	async function refreshStatus() {
		if (!browser || !state.supported) return;
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			state.subscribed = !!subscription;
			state.permission = Notification.permission;
		} catch (e) {
			state.error = e instanceof Error ? e.message : String(e);
		}
	}

	async function subscribe() {
		if (!browser || !state.supported) return { success: false, message: 'Push not supported' };
		state.loading = true;
		state.error = null;
		try {
			const permission = await Notification.requestPermission();
			state.permission = permission;
			if (permission !== 'granted') {
				return { success: false, message: 'Permission denied' };
			}

			const registration = await navigator.serviceWorker.ready;
			let subscription = await registration.pushManager.getSubscription();
			if (!subscription) {
				subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_PUBLIC_KEY)
				});
			}

			const json = subscription.toJSON();
			await request(CREATE_PUSH_SUBSCRIPTION, {
				subscription: {
					endpoint: json.endpoint!,
					p256dh: json.keys!.p256dh,
					auth: json.keys!.auth
				}
			});

			state.subscribed = true;
			return { success: true, message: 'Subscribed to push notifications' };
		} catch (e) {
			state.error = e instanceof Error ? e.message : String(e);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	async function unsubscribe() {
		if (!browser || !state.supported) return { success: false, message: 'Push not supported' };
		state.loading = true;
		state.error = null;
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			if (subscription) {
				const endpoint = subscription.endpoint;
				await subscription.unsubscribe();
				await request(DELETE_PUSH_SUBSCRIPTION, { endpoint });
			}
			state.subscribed = false;
			return { success: true, message: 'Unsubscribed from push notifications' };
		} catch (e) {
			state.error = e instanceof Error ? e.message : String(e);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	return {
		get supported() {
			return state.supported;
		},
		get permission() {
			return state.permission;
		},
		get subscribed() {
			return state.subscribed;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		refreshStatus,
		subscribe,
		unsubscribe
	};
}

export const pushNotificationStore = createPushNotificationStore();
