/// <reference lib="webworker" />
/** @file src/service-worker.ts */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.skipWaiting();
self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

interface NewsPushPayload {
	title: string;
	body: string;
	url?: string | null;
}

self.addEventListener('push', (event: PushEvent) => {
	if (!event.data) return;

	let payload: NewsPushPayload;
	try {
		payload = event.data.json();
	} catch {
		payload = { title: 'ToDzz', body: event.data.text() };
	}

	event.waitUntil(
		self.registration.showNotification(payload.title, {
			body: payload.body,
			icon: '/pwa-192x192.png',
			badge: '/pwa-192x192.png',
			data: { url: payload.url || '/' }
		})
	);
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
	event.notification.close();
	const targetUrl = (event.notification.data as { url?: string } | undefined)?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if ('focus' in client) {
					client.navigate?.(targetUrl);
					return client.focus();
				}
			}
			return self.clients.openWindow(targetUrl);
		})
	);
});
