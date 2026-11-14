/** @file src/routes/api/runner/upload/+server.ts
 * The Kanban runner attaches a finished task's screenshots to its card
 * (svelte-hasura-boilerplate#69). The runner has no user session: it sends its
 * RUNNER_API_TOKEN (#231), or — until every runner has switched — the Hasura admin
 * secret it used for GraphQL. The file goes to
 * the board owner's store — their R2 bucket, else the app's — and becomes an `uploads`
 * row, which the card shows as an attachment. With DATA_BACKEND=d1 the card and the
 * row are on D1 (#247).
 */
import crypto from 'crypto';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { opCtx } from '$lib/server/ops/run';
import { isRunner as hasRunnerToken } from '$lib/server/runner';
import { addUpload, cardOwner } from '$lib/server/runner/attach';
import { getR2Credentials, storeFile } from '$lib/server/storeFile';
import type { RequestHandler } from './$types';

const MAX_BYTES = 5 * 1024 * 1024;

function hasAdminSecret(secret: string | null): boolean {
	const a = Buffer.from(secret ?? '');
	const b = Buffer.from(env.HASURA_ADMIN_SECRET ?? '');
	return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!hasRunnerToken(request) && !hasAdminSecret(request.headers.get('x-hasura-admin-secret')))
		return json({ success: false, error: 'Not authorized' }, { status: 401 });

	const form = await request.formData();
	const todoId = form.get('todo_id');
	const file = form.get('file');
	if (typeof todoId !== 'string' || !(file instanceof File))
		return json({ success: false, error: 'todo_id and file are required' }, { status: 400 });
	if (file.type !== 'image/png' || file.size > MAX_BYTES)
		return json({ success: false, error: 'A PNG of at most 5MB' }, { status: 400 });

	try {
		const ctx = opCtx(null, platform);
		const card = await cardOwner(ctx, todoId);
		if (!card) return json({ success: false, error: 'No such card' }, { status: 404 });
		const name = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const named = name === file.name ? file : new File([file], name, { type: file.type });
		const stored = await storeFile(named, card.owner, getR2Credentials(card.settings));
		if (!stored.success || !stored.url)
			return json({ success: false, error: stored.error ?? 'Upload failed' }, { status: 500 });
		await addUpload(ctx, todoId, stored.url);
		return json({ success: true, url: stored.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Upload failed';
		return json({ success: false, error: message }, { status: 500 });
	}
};
