/** @file src/routes/api/admin/news/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverRequest } from '$lib/graphql/server-client';
import { isAdminEmail, sendPushToAll, type PushSubscriptionRow } from '$lib/server/push';
import { serverLog } from '$lib/server/log';

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();

	if (!session?.user?.id || !isAdminEmail(session.user.email)) {
		throw error(403, 'Forbidden');
	}

	const { title, body, url } = await req.json();

	if (!title || typeof title !== 'string' || !body || typeof body !== 'string') {
		throw error(400, 'Missing title or body');
	}

	try {
		const newsData = await serverRequest<
			{ insert_news_one: { id: string } },
			{ title: string; body: string; url: string | null; created_by: string }
		>(
			`mutation CreateNews($title: String!, $body: String!, $url: String, $created_by: uuid!) {
				insert_news_one(object: { title: $title, body: $body, url: $url, created_by: $created_by }) {
					id
				}
			}`,
			{ title, body, url: url || null, created_by: session.user.id }
		);

		const newsId = newsData.insert_news_one.id;

		const usersData = await serverRequest<{ users: { id: string }[] }, Record<string, never>>(
			`query AllUserIds {
				users {
					id
				}
			}`,
			{}
		);

		// triggered_by_user_id intentionally omitted: the DB's notifications_no_self_notify
		// constraint would reject the admin's own row (user_id === triggered_by_user_id),
		// and a broadcast isn't really "triggered by" a specific user anyway.
		const notificationObjects = usersData.users.map((u) => ({
			user_id: u.id,
			type: 'news',
			content: title,
			related_news_id: newsId
		}));

		if (notificationObjects.length > 0) {
			await serverRequest<
				{ insert_notifications: { affected_rows: number } },
				{ objects: typeof notificationObjects }
			>(
				`mutation BroadcastNewsNotifications($objects: [notifications_insert_input!]!) {
					insert_notifications(objects: $objects) {
						affected_rows
					}
				}`,
				{ objects: notificationObjects }
			);
		}

		const subsData = await serverRequest<
			{ push_subscriptions: PushSubscriptionRow[] },
			Record<string, never>
		>(
			`query AllPushSubscriptions {
				push_subscriptions {
					id
					user_id
					endpoint
					p256dh
					auth
				}
			}`,
			{}
		);

		await sendPushToAll(subsData.push_subscriptions, { title, body, url: url || null });

		serverLog.info('admin/news', 'News broadcast sent', {
			newsId,
			recipients: notificationObjects.length,
			pushed: subsData.push_subscriptions.length
		});

		return json({ success: true, message: 'News sent', data: { id: newsId } });
	} catch (err: any) {
		serverLog.error('admin/news', 'Failed to broadcast news', { message: err?.message });
		throw error(500, 'Failed to send news');
	}
};
