/** @file src/lib/server/news.ts */
// An admin news post: the `news` row, a bell notification for every user, and the push
// subscriptions to send it to (#258: D1 or Hasura, by the ctx).
import { serverRequest } from '$lib/graphql/server-client';
import { news, notifications, push_subscriptions, users } from '$lib/server/db/schema';
import { inChunks } from '$lib/server/ops/d1/sql';
import type { UserCtx } from '$lib/server/ops/op';
import type { PushSubscriptionRow } from '$lib/server/push';

export type Post = { title: string; body: string; url: string | null };
type Posted = { newsId: string; recipients: number; subscriptions: PushSubscriptionRow[] };

/** No `triggered_by_user_id`: notifications_no_self_notify would reject the admin's own row,
 * and a broadcast is triggered by no one in particular. */
const bell = (userId: string, newsId: string, title: string) => ({
	user_id: userId,
	type: 'news',
	content: title,
	related_news_id: newsId
});

async function postD1(ctx: UserCtx & { d1: NonNullable<UserCtx['d1']> }, post: Post) {
	const { d1 } = ctx;
	const newsId = crypto.randomUUID();
	const everyone = await d1.select({ id: users.id }).from(users);
	const rows = everyone.map((u) => ({ id: crypto.randomUUID(), ...bell(u.id, newsId, post.title) }));
	await d1.batch([
		d1.insert(news).values({ id: newsId, ...post, created_by: ctx.userId }),
		...(rows.length ? inChunks(rows, (c) => d1.insert(notifications).values(c)) : [])
	]);
	const subscriptions = await d1.select().from(push_subscriptions);
	return { newsId, recipients: rows.length, subscriptions };
}

async function postHasura(ctx: UserCtx, post: Post): Promise<Posted> {
	const { insert_news_one } = await serverRequest<
		{ insert_news_one: { id: string } },
		Post & { created_by: string }
	>(
		`mutation CreateNews($title: String!, $body: String!, $url: String, $created_by: uuid!) {
			insert_news_one(object: { title: $title, body: $body, url: $url, created_by: $created_by }) { id }
		}`,
		{ ...post, created_by: ctx.userId }
	);
	const newsId = insert_news_one.id;
	const { users: everyone } = await serverRequest<{ users: { id: string }[] }, object>(
		`query AllUserIds { users { id } }`,
		{}
	);
	const objects = everyone.map((u) => bell(u.id, newsId, post.title));
	if (objects.length) {
		await serverRequest(
			`mutation BroadcastNewsNotifications($objects: [notifications_insert_input!]!) {
				insert_notifications(objects: $objects) { affected_rows }
			}`,
			{ objects }
		);
	}
	const { push_subscriptions: subscriptions } = await serverRequest<
		{ push_subscriptions: PushSubscriptionRow[] },
		object
	>(`query AllPushSubscriptions { push_subscriptions { id user_id endpoint p256dh auth } }`, {});
	return { newsId, recipients: objects.length, subscriptions };
}

export const postNews = (ctx: UserCtx, post: Post): Promise<Posted> =>
	ctx.d1 ? postD1({ ...ctx, d1: ctx.d1 }, post) : postHasura(ctx, post);
