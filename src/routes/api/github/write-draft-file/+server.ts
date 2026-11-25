/** @file src/routes/api/github/write-draft-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { githubCard, setTaskPath } from '$lib/server/github/routeCards';
import { withPin } from '$lib/utils/agentMachine';
import { buildDraftFile, camelName, nextNumber } from '$lib/server/taskfile';
import { makeRoom } from '$lib/server/taskdir';
import { opCtx } from '$lib/server/ops/run';

export const POST: RequestHandler = async ({ request: req, locals, platform }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { todoId }: { todoId?: string } = await req.json();
	if (!todoId) throw error(400, 'Missing todoId');

	const ctx = opCtx(session.user.id, platform);
	const todo = withPin(await githubCard(ctx, todoId), session.user.email);

	if (!todo) return json({ skipped: 'todo not found' });
	if (todo.task_file_path)
		return json({ skipped: 'draft already exists', path: todo.task_file_path });

	const board = todo?.list?.board;
	if (!board?.github) return json({ skipped: 'board not connected to a repo' });

	const gh = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
	const repo = `${gh.owner}/${gh.repo}`;

	try {
		const token = await getGithubToken(ctx, session.user.id);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');

		const body = buildDraftFile(todo);
		const bytes = new TextEncoder().encode(body);
		let binary = '';
		for (const b of bytes) binary += String.fromCharCode(b);
		const content = btoa(binary);
		const slug = camelName(todo.title);
		const issueNumber: number | null = todo.github_issue_number ?? null;
		const ref = issueNumber ? ` (#${issueNumber})` : '';

		let path = '';
		for (let attempt = 0; ; attempt++) {
			const { dir, names } = await makeRoom(repo, token, attempt ? null : issueNumber, ref);
			path = `${dir}/${nextNumber(names, attempt ? null : issueNumber)}-${slug}.md`;
			try {
				await githubRequest(`/repos/${repo}/contents/${path}`, token, {
					method: 'PUT',
					body: JSON.stringify({ message: `docs(todo): draft ${path}${ref}`, content })
				});
				break;
			} catch (err: any) {
				const taken = err.message?.includes('(409)') || err.message?.includes('(422)');
				if (!taken || attempt === 1) throw err;
			}
		}

		await setTaskPath(ctx, todoId, path);

		return json({ success: true, path });
	} catch (err: any) {
		return json({ success: false, message: err.message });
	}
};
