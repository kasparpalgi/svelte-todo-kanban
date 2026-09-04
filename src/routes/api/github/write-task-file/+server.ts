/** @file src/routes/api/github/write-task-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { CREATE_COMMENT } from '$lib/graphql/documents';
import { buildTaskFile, camelName, nextNumber } from '$lib/server/taskfile';
import { loggingStore } from '$lib/stores/logging.svelte';

const GET_TODO_FOR_TASK_FILE = `
	query GetTodoForTaskFile($todoId: uuid!) {
		todos_by_pk(id: $todoId) {
			id
			title
			content
			github_issue_number
			list {
				id
				board {
					id
					github
					settings
				}
			}
		}
	}
`;

/** Filenames in a repo folder, or null when it does not exist. */
async function listDir(repo: string, dir: string, token: string): Promise<string[] | null> {
	try {
		const entries = await githubRequest<{ name: string }[]>(
			`/repos/${repo}/contents/${dir}`,
			token
		);
		return Array.isArray(entries) ? entries.map((e) => e.name) : [];
	} catch (err: any) {
		if (err.message?.includes('(404)')) return null;
		throw err;
	}
}

/** The task folder this repo uses: `.claude/todo` if it has one, else `doc/todo`. */
async function taskDir(repo: string, token: string) {
	const dotClaude = await listDir(repo, '.claude/todo', token);
	if (dotClaude) return { dir: '.claude/todo', names: dotClaude };
	return { dir: 'doc/todo', names: (await listDir(repo, 'doc/todo', token)) ?? [] };
}

/** Leave a trail on the card — the file that was written, and why not, when it failed. */
async function commentOnCard(todoId: string, userId: string, content: string) {
	await serverRequest(CREATE_COMMENT, {
		objects: [{ todo_id: todoId, user_id: userId, content }]
	}).catch((err) => console.error('[write-task-file] comment failed:', err));
}

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');
	const userId = session.user.id;

	const { todoId }: { todoId?: string } = await req.json();
	if (!todoId) throw error(400, 'Missing todoId');

	const data = await serverRequest<{ todos_by_pk: any }, { todoId: string }>(
		GET_TODO_FOR_TASK_FILE,
		{ todoId }
	);
	const todo = data.todos_by_pk;
	const board = todo?.list?.board;

	// Opt-in per board, by list id — list names are free text in any language.
	if (!board || board.settings?.agent_list_id !== todo.list.id) {
		return json({ skipped: 'not the agent list' });
	}
	if (!board.github) return json({ skipped: 'board not connected to a repo' });

	const gh = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
	const repo = `${gh.owner}/${gh.repo}`;

	try {
		const token = await getGithubToken(userId);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');

		const body = buildTaskFile(todo);
		const bytes = new TextEncoder().encode(body);
		let binary = '';
		for (const b of bytes) binary += String.fromCharCode(b);
		const content = btoa(binary);
		const slug = camelName(todo.title);

		// Two cards moved at once race on NNN; one retry is enough at this scale.
		let path = '';
		for (let attempt = 0; ; attempt++) {
			const { dir, names } = await taskDir(repo, token);
			path = `${dir}/${nextNumber(names)}-${slug}-TODO.md`;
			try {
				await githubRequest(`/repos/${repo}/contents/${path}`, token, {
					method: 'PUT',
					body: JSON.stringify({ message: `docs(todo): ${path} from Kanban`, content })
				});
				break;
			} catch (err: any) {
				const taken = err.message?.includes('(409)') || err.message?.includes('(422)');
				if (!taken || attempt === 1) throw err;
			}
		}

		const issue = todo.github_issue_number ? ` (issue #${todo.github_issue_number})` : '';
		await commentOnCard(todoId, userId, `Task file written: ${path}${issue}`);

		loggingStore.info('TaskFile', 'Wrote task file to GitHub', { todoId, repo, path });
		return json({ success: true, path });
	} catch (err: any) {
		// A repo the token lost access to must surface on the card, never as a 500.
		await commentOnCard(todoId, userId, `Could not write the task file to ${repo}: ${err.message}`);
		loggingStore.error('TaskFile', 'Failed to write task file', {
			todoId,
			repo,
			error: err.message
		});
		return json({ success: false, message: err.message });
	}
};
