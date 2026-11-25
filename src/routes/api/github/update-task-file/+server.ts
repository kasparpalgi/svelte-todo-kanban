/** @file src/routes/api/github/update-task-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { githubCard } from '$lib/server/github/routeCards';
import { withPin } from '$lib/utils/agentMachine';
import { buildDraftFile } from '$lib/server/taskfile';
import { withComments } from '$lib/server/cardThread';
import { opCtx } from '$lib/server/ops/run';

export const POST: RequestHandler = async ({ request: req, locals, platform }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { todoId }: { todoId?: string } = await req.json();
	if (!todoId) throw error(400, 'Missing todoId');

	const ctx = opCtx(session.user.id, platform);
	const todo = withPin(await githubCard(ctx, todoId), session.user.email);

	if (!todo?.task_file_path) return json({ skipped: 'no task file path' });

	const board = todo?.list?.board;
	if (!board?.github) return json({ skipped: 'board not connected to a repo' });

	const gh = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
	const repo = `${gh.owner}/${gh.repo}`;

	try {
		const token = await getGithubToken(ctx, session.user.id);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');

		// GET current file SHA
		const fileInfo = await githubRequest<{ sha: string }>(
			`/repos/${repo}/contents/${todo.task_file_path}`,
			token
		);

		// The rewrite keeps the card's comments, or an edit would drop the rework feedback.
		const body = withComments(buildDraftFile(todo), todo.comments);
		const bytes = new TextEncoder().encode(body);
		let binary = '';
		for (const b of bytes) binary += String.fromCharCode(b);
		const content = btoa(binary);

		await githubRequest(`/repos/${repo}/contents/${todo.task_file_path}`, token, {
			method: 'PUT',
			body: JSON.stringify({
				message: `docs(todo): update ${todo.task_file_path}`,
				content,
				sha: fileInfo.sha
			})
		});

		return json({ success: true, path: todo.task_file_path });
	} catch (err: any) {
		return json({ success: false, message: err.message });
	}
};
