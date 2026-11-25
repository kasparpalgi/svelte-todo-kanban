/** @file src/routes/api/github/webhook/+server.ts */
// GitHub webhook: issues (edit, close, reopen, priority labels), issue comments (create,
// edit, delete) and pushes to main/master (commits naming an issue, task files going DONE).
// Each event is handled in src/lib/server/github/, on Hasura or D1 (#263).
import { json, error } from '@sveltejs/kit';
import crypto from 'crypto';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { handleCommentEvent } from '$lib/server/github/commentEvents';
import { d1Webhook } from '$lib/server/github/d1Webhook';
import { hasuraWebhook } from '$lib/server/github/hasuraWebhook';
import { handleIssueEvent } from '$lib/server/github/issueEvents';
import { handlePushEvent } from '$lib/server/github/pushEvents';
import { opCtx } from '$lib/server/ops/run';

/** HMAC SHA-256 of the body with the webhook secret, compared in constant time. */
function verifySignature(payload: string, signature: string | null): boolean {
	if (!signature) return false;
	if (!env.GITHUB_WEBHOOK_SECRET) {
		console.error('GITHUB_WEBHOOK_SECRET not configured');
		return false;
	}
	const digest =
		'sha256=' +
		crypto.createHmac('sha256', env.GITHUB_WEBHOOK_SECRET).update(payload).digest('hex');
	const given = Buffer.from(signature);
	const expected = Buffer.from(digest);
	return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = await request.text();
		if (!verifySignature(body, request.headers.get('x-hub-signature-256'))) {
			console.error('Invalid webhook signature');
			throw error(401, 'Invalid signature');
		}

		const event = JSON.parse(body);
		const eventType = request.headers.get('x-github-event');
		const deliveryId = request.headers.get('x-github-delivery');
		console.log(`Received GitHub webhook: ${eventType} (delivery: ${deliveryId})`);

		const ctx = opCtx(null, platform);
		const db = ctx.d1 ? d1Webhook({ ...ctx, d1: ctx.d1 }) : hasuraWebhook;
		switch (eventType) {
			case 'issues':
				await handleIssueEvent(db, event);
				break;
			case 'issue_comment':
				await handleCommentEvent(db, event);
				break;
			case 'push':
				await handlePushEvent(ctx, db, event);
				break;
			case 'ping':
				console.log('Webhook ping received');
				break;
			default:
				console.log(`Unhandled event type: ${eventType}`);
		}

		return json({ success: true, event: eventType, deliveryId });
	} catch (err) {
		console.error('Webhook processing error:', err);
		// Don't expose internal errors to GitHub
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw error(500, 'Internal server error');
	}
};
