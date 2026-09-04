/** @file src/routes/api/github/write-draft-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { buildDraftFile, camelName, nextNumber } from '$lib/server/taskfile';

const GET_TODO_FOR_DRAFT = `
	query GetTodoForDraft($todoId: uuid!) {
		todos_by_pk(id: $todoId) {
			id
			title
			content
			task_file_path
			list {
				board {
					github
				}
			}
		}
	}
`;

const UPDATE_TASK_FILE_PATH = `
	mutation UpdateTaskFilePath($id: uuid!, $path: String) {
		update_todos_by_pk(pk_columns: { id: $id }, _set: { task_file_path: $path }) {
			id
		}
	}
`;

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

async function taskDir(repo: string, token: string) {
	const dotClaude = await listDir(repo, '.claude/todo', token);
	if (dotClaude) return { dir: '.claude/todo', names: dotClaude };
	return { dir: 'doc/todo', names: (await listDir(repo, 'doc/todo', token)) ?? [] };
}

export const POST: RequestHandler = async ({ request: req, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const { todoId }: { todoId?: string } = await req.json();
	if (!todoId) throw error(400, 'Missing todoId');

	const data = await serverRequest<{ todos_by_pk: any }, { todoId: string }>(GET_TODO_FOR_DRAFT, {
		todoId
	});
	const todo = data.todos_by_pk;

	if (!todo) return json({ skipped: 'todo not found' });
	if (todo.task_file_path)
		return json({ skipped: 'draft already exists', path: todo.task_file_path });

	const board = todo?.list?.board;
	if (!board?.github) return json({ skipped: 'board not connected to a repo' });

	const gh = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
	const repo = `${gh.owner}/${gh.repo}`;

	try {
		const token = await getGithubToken(session.user.id);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');

		const body = buildDraftFile(todo);
		const bytes = new TextEncoder().encode(body);
		let binary = '';
		for (const b of bytes) binary += String.fromCharCode(b);
		const content = btoa(binary);
		const slug = camelName(todo.title);

		let path = '';
		for (let attempt = 0; ; attempt++) {
			const { dir, names } = await taskDir(repo, token);
			path = `${dir}/${nextNumber(names)}-${slug}.md`;
			try {
				await githubRequest(`/repos/${repo}/contents/${path}`, token, {
					method: 'PUT',
					body: JSON.stringify({ message: `docs(todo): draft ${path}`, content })
				});
				break;
			} catch (err: any) {
				const taken = err.message?.includes('(409)') || err.message?.includes('(422)');
				if (!taken || attempt === 1) throw err;
			}
		}

		await serverRequest(UPDATE_TASK_FILE_PATH, { id: todoId, path });

		return json({ success: true, path });
	} catch (err: any) {
		return json({ success: false, message: err.message });
	}
};
