/** @file src/routes/api/github/write-task-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { CREATE_COMMENT } from '$lib/graphql/documents';
import {
	buildTaskFile,
	camelName,
	ensureFooter,
	ensureRunWith,
	nextNumber,
	todoPathFor
} from '$lib/server/taskfile';
import type { TaskCard } from '$lib/server/taskfile';
import { serverLog } from '$lib/server/log';

const GET_TODO_FOR_TASK_FILE = `
	query GetTodoForTaskFile($todoId: uuid!) {
		todos_by_pk(id: $todoId) {
			id
			title
			content
			agent_model
			agent_effort
			github_issue_number
			task_file_path
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

/**
 * `task_file_path` is never cleared, so it outlives the file it names — deleted by hand,
 * or renamed to `-DONE.md` by the agent. Trusting it made a re-move to the agent list a
 * silent no-op. Confirm the file is really there before reusing the path.
 */
async function fileExists(repo: string, path: string, token: string): Promise<boolean> {
	try {
		await githubRequest(`/repos/${repo}/contents/${path}`, token);
		return true;
	} catch (err: any) {
		if (err.message?.includes('(404)')) return false;
		throw err;
	}
}

async function commentOnCard(todoId: string, userId: string, content: string) {
	await serverRequest(CREATE_COMMENT, {
		objects: [{ todo_id: todoId, user_id: userId, content }]
	}).catch((err) => console.error('[write-task-file] comment failed:', err));
}

/** GitHub wants base64, and the body is UTF-8 markdown. */
const encode = (body: string) => Buffer.from(body, 'utf8').toString('base64');

/** Rename a draft file (no -TODO) to a TODO file by delete + create. */
async function renameDraftToTodo(
	repo: string,
	draftPath: string,
	token: string,
	card: TaskCard,
	ref: string
): Promise<string> {
	// Derive the TODO path: insert -TODO before the final .md, renumbering to the issue
	const todoPath = todoPathFor(draftPath, card.github_issue_number);

	// Get the current content + SHA of the draft
	const fileInfo = await githubRequest<{ content: string; sha: string }>(
		`/repos/${repo}/contents/${draftPath}`,
		token
	);

	// The draft keeps every word it has, but it froze its `> Run with:` line at creation time
	// (usually before the model dropdown was touched) and may predate the card/issue footers the
	// runner needs — reconcile the model line with the card's now-set field, then add any missing
	// footer.
	const body = Buffer.from(fileInfo.content, 'base64').toString('utf8');

	// Create the TODO file with the draft's content
	await githubRequest(`/repos/${repo}/contents/${todoPath}`, token, {
		method: 'PUT',
		body: JSON.stringify({
			message: `docs(todo): ${todoPath} from Kanban${ref}`,
			content: encode(ensureFooter(ensureRunWith(body, card), card))
		})
	});

	// Delete the draft
	await githubRequest(`/repos/${repo}/contents/${draftPath}`, token, {
		method: 'DELETE',
		body: JSON.stringify({
			message: `docs(todo): replace ${draftPath} with ${todoPath}${ref}`,
			sha: fileInfo.sha
		})
	});

	return todoPath;
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

	if (!board || board.settings?.agent_list_id !== todo.list.id) {
		return json({ skipped: 'not the agent list' });
	}
	if (!board.github) {
		serverLog.warn('TaskFile', 'Board has no repo connected', { todoId });
		return json({ skipped: 'board not connected to a repo' });
	}

	const gh = typeof board.github === 'string' ? JSON.parse(board.github) : board.github;
	const repo = `${gh.owner}/${gh.repo}`;

	try {
		const token = await getGithubToken(userId);
		if (!token) throw new Error('GitHub not connected. Reconnect it in settings.');

		let path = '';
		const issueNumber: number | null = todo.github_issue_number ?? null;
		// Trailing `(#165)` in the subject is what makes GitHub show the commit on the issue.
		const ref = issueNumber ? ` (#${issueNumber})` : '';
		const known: string | null = todo.task_file_path ?? null;
		const existing = known && (await fileExists(repo, known, token)) ? known : null;

		if (known && !existing) {
			serverLog.warn('TaskFile', 'Card points at a file that is gone — writing a fresh one', {
				todoId,
				repo,
				stalePath: known
			});
		}

		if (existing && !existing.endsWith('-TODO.md')) {
			// Rename the existing draft → -TODO.md
			path = await renameDraftToTodo(repo, existing, token, todo, ref);
		} else if (existing) {
			// Already a TODO file — nothing to do
			serverLog.info('TaskFile', 'Task file already waiting for the agent', {
				todoId,
				repo,
				path: existing
			});
			return json({ skipped: 'already a TODO file', path: existing });
		} else {
			// No usable file — create a fresh TODO file
			const content = encode(buildTaskFile(todo));
			const slug = camelName(todo.title);

			for (let attempt = 0; ; attempt++) {
				const { dir, names } = await taskDir(repo, token);
				path = `${dir}/${nextNumber(names, attempt ? null : issueNumber)}-${slug}-TODO.md`;
				try {
					await githubRequest(`/repos/${repo}/contents/${path}`, token, {
						method: 'PUT',
						body: JSON.stringify({ message: `docs(todo): ${path} from Kanban${ref}`, content })
					});
					break;
				} catch (err: any) {
					const taken = err.message?.includes('(409)') || err.message?.includes('(422)');
					if (!taken || attempt === 1) throw err;
				}
			}
		}

		await serverRequest(UPDATE_TASK_FILE_PATH, { id: todoId, path });

		await commentOnCard(todoId, userId, `Task file ready: ${path}${ref}`);

		serverLog.info('TaskFile', 'Task file ready in GitHub', { todoId, repo, path });
		return json({ success: true, path });
	} catch (err: any) {
		await commentOnCard(todoId, userId, `Could not write the task file to ${repo}: ${err.message}`);
		serverLog.error('TaskFile', 'Failed to write task file', {
			todoId,
			repo,
			error: err.message
		});
		return json({ success: false, message: err.message });
	}
};
