/** @file src/routes/api/github/delete-task-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken } from '$lib/server/github';
import { dropTaskFiles } from '$lib/server/taskdir';
import { serverLog } from '$lib/server/log';

/** Only a task file: `doc/todo/NNN-slug….md` or `.claude/todo/NNN-slug….md`. */
const TASK_PATH = /^(doc|\.claude)\/todo\/\d+-[^/]+\.md$/;

/**
 * A deleted card takes its task file with it (svelte-hasura-boilerplate#79). The card row
 * is already gone, so the client sends the path and repo; the user's own token does the
 * delete, so they can remove only what they could remove on GitHub anyway.
 */
export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { path, owner, repo, issueNumber } = await req.json();
	if (!owner || !repo || typeof path !== 'string' || !TASK_PATH.test(path)) {
		throw error(400, 'Missing or invalid task file path');
	}

	const full = `${owner}/${repo}`;
	try {
		const token = await getGithubToken(session.user.id);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');
		const deleted = await dropTaskFiles(full, token, path, issueNumber ? ` (#${issueNumber})` : '');
		serverLog.info('TaskFile', 'Card deleted — task files removed', { repo: full, deleted });
		return json({ success: true, deleted });
	} catch (err: any) {
		serverLog.error('TaskFile', 'Failed to delete task file', { repo: full, error: err.message });
		return json({ success: false, message: err.message });
	}
};
