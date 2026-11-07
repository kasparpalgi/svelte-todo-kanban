/** @file src/lib/server/unqueue.ts */
import { json } from '@sveltejs/kit';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { CREATE_COMMENT, UPDATE_TASK_FILE_PATH } from '$lib/graphql/documents';
import { commitTree } from '$lib/server/taskdir';
import { serverLog } from '$lib/server/log';

/** `NNN-slug-TODO.md` → `NNN-slug.md`: the draft a queued task file came from. */
export const draftPathFor = (todoPath: string) => todoPath.replace(/-TODO\.md$/i, '.md');

/** Swap the -TODO file for its draft in one commit; null when the file is already gone. */
async function todoToDraft(repo: string, token: string, todoPath: string, ref: string) {
	let sha: string;
	try {
		({ sha } = await githubRequest<{ sha: string }>(`/repos/${repo}/contents/${todoPath}`, token));
	} catch (err: any) {
		if (err.message?.includes('(404)')) return null;
		throw err;
	}
	const draftPath = draftPathFor(todoPath);
	await commitTree(repo, token, `docs(todo): ${draftPath} back to draft${ref}`, [
		{ path: draftPath, mode: '100644', type: 'blob', sha },
		{ path: todoPath, mode: '100644', type: 'blob', sha: null }
	]);
	return draftPath;
}

const say = (todoId: string, userId: string, content: string) =>
	serverRequest(CREATE_COMMENT, { objects: [{ todo_id: todoId, user_id: userId, content }] }).catch(
		(err) => console.error('[unqueue] comment failed:', err)
	);

/**
 * A card dragged out of the agent list takes its file out of the queue. The runner reads
 * only the filename, so a `-TODO.md` left behind still runs (svelte-hasura-boilerplate#51).
 * The draft keeps its `_From Kanban card_` line, which stops the runner's follow-up sweep
 * filing it as a fresh Backlog card; moving the card back renames it to -TODO again.
 */
export async function unqueue(todo: any, github: unknown, userId: string) {
	const gh = typeof github === 'string' ? JSON.parse(github) : (github as any);
	const repo = `${gh.owner}/${gh.repo}`;
	const ref = todo.github_issue_number ? ` (#${todo.github_issue_number})` : '';
	try {
		const token = await getGithubToken(userId);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');
		const path = await todoToDraft(repo, token, todo.task_file_path, ref);
		if (!path) return json({ skipped: 'TODO file is gone' });
		await serverRequest(UPDATE_TASK_FILE_PATH, { id: todo.id, path });
		await say(todo.id, userId, `Task file back to draft: ${path}${ref}`);
		serverLog.info('TaskFile', 'Card left the agent list — task file unqueued', { repo, path });
		return json({ success: true, path });
	} catch (err: any) {
		await say(todo.id, userId, `Could not unqueue the task file in ${repo}: ${err.message}`);
		serverLog.error('TaskFile', 'Failed to unqueue task file', { repo, error: err.message });
		return json({ success: false, message: err.message });
	}
}
