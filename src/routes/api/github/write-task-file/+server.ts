/** @file src/routes/api/github/write-task-file/+server.ts */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGithubToken, githubRequest } from '$lib/server/github';
import { serverRequest } from '$lib/graphql/server-client';
import { CREATE_COMMENT, UPDATE_TASK_FILE_PATH } from '$lib/graphql/documents';
import {
	buildTaskFile,
	camelName,
	toText,
	ensureFooter,
	ensureMachine,
	ensureRunWith,
	nextNumber,
	todoPathFor
} from '$lib/server/taskfile';
import type { TaskCard } from '$lib/server/taskfile';
import { commitTree, makeRoom } from '$lib/server/taskdir';
import { serverLog } from '$lib/server/log';

const GET_TODO_FOR_TASK_FILE = `
	query GetTodoForTaskFile($todoId: uuid!) {
		todos_by_pk(id: $todoId) {
			id
			title
			content
			agent_model
			agent_effort
			agent_machine
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

/**
 * The words a draft goes to the agent with. Saving a card no longer rewrites its draft (one
 * commit per save), so the draft holds the card's text as it was at creation — and an edit
 * since then lives only on the card. The draft wins while it still holds the card's text,
 * since an agent may have written it with more; otherwise the card does.
 */
export function publishedBody(draft: string, card: TaskCard): string {
	if (!draft.includes(toText(card.content))) return buildTaskFile(card);
	return ensureFooter(ensureMachine(ensureRunWith(draft, card), card), card);
}

/** Swap a draft (no -TODO) for its TODO file in one commit. */
async function renameDraftToTodo(
	repo: string,
	draftPath: string,
	token: string,
	card: TaskCard,
	ref: string
): Promise<string> {
	// Derive the TODO path: insert -TODO before the final .md, renumbering to the issue
	const todoPath = todoPathFor(draftPath, card.github_issue_number);

	const fileInfo = await githubRequest<{ content: string }>(
		`/repos/${repo}/contents/${draftPath}`,
		token
	);
	const draft = Buffer.from(fileInfo.content, 'base64').toString('utf8');

	// Whatever already holds the issue's number moves to archive/, so file and issue match.
	await makeRoom(repo, token, card.github_issue_number, ref, draftPath.split('/').pop());

	try {
		await commitTree(repo, token, `docs(todo): ${todoPath} from Kanban${ref}`, [
			{ path: todoPath, mode: '100644', type: 'blob', content: publishedBody(draft, card) },
			{ path: draftPath, mode: '100644', type: 'blob', sha: null }
		]);
	} catch (err: any) {
		serverLog.error('TaskFile', 'Draft → TODO commit failed', {
			draftPath,
			todoPath,
			error: err.message
		});
		throw err;
	}

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
				const { dir, names } = await makeRoom(repo, token, attempt ? null : issueNumber, ref);
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
