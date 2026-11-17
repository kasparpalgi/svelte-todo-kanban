/** @file src/routes/api/admin/news/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { postNews } from '$lib/server/news';
import { opCtx } from '$lib/server/ops/run';
import { isAdminEmail, sendPushToAll } from '$lib/server/push';
import { serverLog } from '$lib/server/log';

export const POST: RequestHandler = async ({ request: req, locals, platform }) => {
	const session = await locals.auth();

	if (!session?.user?.id || !isAdminEmail(session.user.email)) {
		throw error(403, 'Forbidden');
	}

	const { title, body, url } = await req.json();

	if (!title || typeof title !== 'string' || !body || typeof body !== 'string') {
		throw error(400, 'Missing title or body');
	}

	try {
		const ctx = opCtx(session.user.id, platform);
		const posted = await postNews(ctx, { title, body, url: url || null });
		await sendPushToAll(ctx, posted.subscriptions, { title, body, url: url || null });

		serverLog.info('admin/news', 'News broadcast sent', {
			newsId: posted.newsId,
			recipients: posted.recipients,
			pushed: posted.subscriptions.length
		});

		return json({ success: true, message: 'News sent', data: { id: posted.newsId } });
	} catch (err: any) {
		serverLog.error('admin/news', 'Failed to broadcast news', { message: err?.message });
		throw error(500, 'Failed to send news');
	}
};
