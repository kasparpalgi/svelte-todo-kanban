/** @file src/routes/api/runner/upload/+server.ts
 * The Kanban runner attaches a finished task's screenshots to its card
 * (svelte-hasura-boilerplate#69). The runner has no user session, only the Hasura admin
 * secret it already uses for GraphQL, so that is its credential here. The file goes to
 * the board owner's store — their R2 bucket, else the app's — and becomes an `uploads`
 * row, which the card shows as an attachment.
 */
import crypto from 'crypto';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { serverRequest } from '$lib/graphql/server-client';
import { getPlanContext } from '$lib/server/plan';
import { getR2Credentials, storeFile } from '$lib/server/storeFile';
import type { RequestHandler } from './$types';

const MAX_BYTES = 5 * 1024 * 1024;

function isRunner(secret: string | null): boolean {
	const a = Buffer.from(secret ?? '');
	const b = Buffer.from(env.HASURA_ADMIN_SECRET ?? '');
	return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const POST: RequestHandler = async ({ request }) => {
	if (!isRunner(request.headers.get('x-hasura-admin-secret')))
		return json({ success: false, error: 'Not authorized' }, { status: 401 });

	const form = await request.formData();
	const todoId = form.get('todo_id');
	const file = form.get('file');
	if (typeof todoId !== 'string' || !(file instanceof File))
		return json({ success: false, error: 'todo_id and file are required' }, { status: 400 });
	if (file.type !== 'image/png' || file.size > MAX_BYTES)
		return json({ success: false, error: 'A PNG of at most 5MB' }, { status: 400 });

	const { todos_by_pk: todo } = await serverRequest<
		{ todos_by_pk: { list: { board: { user_id: string } } | null } | null },
		{ id: string }
	>(`query RunnerTodo($id: uuid!) { todos_by_pk(id: $id) { list { board { user_id } } } }`, {
		id: todoId
	});
	const owner = todo?.list?.board.user_id;
	if (!owner) return json({ success: false, error: 'No such card' }, { status: 404 });

	try {
		const name = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const named = name === file.name ? file : new File([file], name, { type: file.type });
		const ctx = await getPlanContext(owner);
		const stored = await storeFile(named, owner, getR2Credentials(ctx?.settings ?? null));
		if (!stored.success || !stored.url)
			return json({ success: false, error: stored.error ?? 'Upload failed' }, { status: 500 });
		await serverRequest(
			`mutation RunnerUpload($o: uploads_insert_input!) { insert_uploads_one(object: $o) { id } }`,
			{ o: { todo_id: todoId, url: stored.url } }
		);
		return json({ success: true, url: stored.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Upload failed';
		return json({ success: false, error: message }, { status: 500 });
	}
};
