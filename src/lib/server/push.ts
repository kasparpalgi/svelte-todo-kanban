/** @file src/lib/server/push.ts */
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '$env/static/private';
import { serverRequest } from '$lib/graphql/server-client';
import { serverLog } from '$lib/server/log';

export { isAdminEmail } from '$lib/server/admin';

// Configure VAPID lazily on first use rather than at import time. Doing it at the
// top level runs during SvelteKit's build-time `analyse` step, where an absent or
// malformed VAPID key throws and fails the whole build. Initializing on demand lets
// a bad config degrade push notifications at runtime instead of breaking the deploy.
let vapidConfigured: boolean | null = null;

function ensureVapid(): boolean {
	if (vapidConfigured !== null) return vapidConfigured;
	try {
		webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
		vapidConfigured = true;
	} catch (error: any) {
		serverLog.error('push', 'Invalid VAPID configuration; push disabled', {
			message: error?.message
		});
		vapidConfigured = false;
	}
	return vapidConfigured;
}

export interface PushSubscriptionRow {
	id: string;
	user_id: string;
	endpoint: string;
	p256dh: string;
	auth: string;
}

export async function sendPushToAll(
	subscriptions: PushSubscriptionRow[],
	payload: { title: string; body: string; url?: string | null }
) {
	if (!ensureVapid()) return;

	const deadEndpoints: string[] = [];

	await Promise.all(
		subscriptions.map(async (sub) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { p256dh: sub.p256dh, auth: sub.auth }
					},
					JSON.stringify(payload)
				);
			} catch (error: any) {
				const statusCode = error?.statusCode;
				if (statusCode === 404 || statusCode === 410) {
					deadEndpoints.push(sub.endpoint);
				} else {
					serverLog.error('push', 'sendNotification failed', {
						endpoint: sub.endpoint,
						statusCode,
						message: error?.message
					});
				}
			}
		})
	);

	if (deadEndpoints.length > 0) {
		await serverRequest<
			{ delete_push_subscriptions: { affected_rows: number } },
			{ endpoints: string[] }
		>(
			`mutation PruneDeadSubscriptions($endpoints: [String!]!) {
				delete_push_subscriptions(where: { endpoint: { _in: $endpoints } }) {
					affected_rows
				}
			}`,
			{ endpoints: deadEndpoints }
		);
	}
}
