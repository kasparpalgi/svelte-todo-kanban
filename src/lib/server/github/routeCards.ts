/** @file src/lib/server/github/routeCards.ts */
// What the GitHub routes read from and write back to a card (#264), on either backend. The
// read goes through the `getTodo` op first, so a card the caller cannot see is `null`; the
// D1 writes check edit rights and stamp `boards.changed_at`, which the 30 s poll compares.
import { asc, eq } from 'drizzle-orm';
import { canEdit, isMember } from '$lib/server/access';
import {
	CREATE_COMMENT,
	UPDATE_COMMENT,
	UPDATE_TODOS,
	UPDATE_TASK_FILE_PATH
} from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import type { D1 } from '$lib/server/db';
import { comments, todos } from '$lib/server/db/schema';
import { requireCard, written } from '$lib/server/ops/d1/cardAccess';
import { githubJson } from '$lib/server/ops/d1/boardRows';
import { OpError, type UserCtx } from '$lib/server/ops/op';
import { callOp } from '$lib/server/ops/run';

type D1Ctx = UserCtx & { d1: D1 };

/** The card as the task-file and issue routes use it. `board.github` is the JSON text. */
export type GithubCard = {
	id: string;
	title: string;
	content: string | null;
	agent_model: string | null;
	agent_effort: string | null;
	agent_machine: string | null;
	agent_plan_first: boolean;
	github_issue_number: number | null;
	task_file_path: string | null;
	comments: {
		content: string;
		created_at: string | null;
		user: { name: string | null; username: string } | null;
	}[];
	list: {
		id: string;
		board: { id: string; github: string | null; settings: Record<string, any> } | null;
	} | null;
};

const GET_CARD_FOR_GITHUB = `
	query GetTodoForTaskFile($todoId: uuid!) {
		todos_by_pk(id: $todoId) {
			id
			title
			content
			agent_model
			agent_effort
			agent_machine
			agent_plan_first
			github_issue_number
			task_file_path
			comments(order_by: { created_at: asc }) {
				content
				created_at
				user {
					name
					username
				}
			}
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

/** The card with its comments and board, or null when it is gone or the caller cannot read it. */
export async function githubCard(ctx: UserCtx, todoId: string): Promise<GithubCard | null> {
	try {
		if (!(await callOp('getTodo', ctx, { id: todoId }))) return null;
	} catch (err) {
		// A card the caller may not read is as good as gone: say nothing of it.
		if (err instanceof OpError && err.status === 403) return null;
		throw err;
	}
	if (!ctx.d1) {
		const data = await serverRequest<{ todos_by_pk: GithubCard | null }, { todoId: string }>(
			GET_CARD_FOR_GITHUB,
			{ todoId }
		);
		return data.todos_by_pk;
	}
	const { d1 } = ctx;
	const card = await d1.query.todos.findFirst({
		where: eq(todos.id, todoId),
		columns: {
			id: true,
			title: true,
			content: true,
			agent_model: true,
			agent_effort: true,
			agent_machine: true,
			agent_plan_first: true,
			github_issue_number: true,
			task_file_path: true
		},
		with: {
			list: {
				columns: { id: true },
				with: { board: { columns: { id: true, github_repo: true, settings: true } } }
			}
		}
	});
	if (!card) return null;
	const thread = await d1.query.comments.findMany({
		where: eq(comments.todo_id, todoId),
		orderBy: asc(comments.created_at),
		columns: { content: true, created_at: true },
		with: { user: { columns: { name: true, username: true } } }
	});
	const { list, ...rest } = card;
	const board = list?.board;
	return {
		...rest,
		comments: thread,
		list: list && {
			id: list.id,
			board: board
				? { id: board.id, github: githubJson(board.github_repo), settings: board.settings }
				: null
		}
	};
}

/** GitHub ids onto the card after an issue is created or synced. */
export async function markIssue(
	ctx: UserCtx,
	todoId: string,
	set: Partial<typeof todos.$inferInsert>
) {
	if (!ctx.d1) return serverRequest(UPDATE_TODOS, { where: { id: { _eq: todoId } }, _set: set });
	const { boardId } = await requireCard(ctx as D1Ctx, todoId, canEdit);
	await written(
		ctx as D1Ctx,
		[ctx.d1.update(todos).set(set).where(eq(todos.id, todoId))],
		[boardId]
	);
}

/** The GitHub id onto the caller's own comment, once it is posted. */
export async function markComment(ctx: UserCtx, commentId: string, githubCommentId: number) {
	const set = { github_comment_id: githubCommentId, github_synced_at: new Date().toISOString() };
	if (!ctx.d1)
		return serverRequest(UPDATE_COMMENT, { where: { id: { _eq: commentId } }, _set: set });
	const [row] = await ctx.d1
		.select({ todo_id: comments.todo_id, user_id: comments.user_id })
		.from(comments)
		.where(eq(comments.id, commentId));
	if (!row) throw new OpError(404, 'Comment not found');
	if (row.user_id !== ctx.userId) throw new OpError(403, 'Only the author syncs a comment');
	const { boardId } = await requireCard(ctx as D1Ctx, row.todo_id, isMember);
	await written(
		ctx as D1Ctx,
		[ctx.d1.update(comments).set(set).where(eq(comments.id, commentId))],
		[boardId]
	);
}

export async function setTaskPath(ctx: UserCtx, id: string, path: string) {
	if (!ctx.d1) return serverRequest(UPDATE_TASK_FILE_PATH, { id, path });
	const { boardId } = await requireCard(ctx as D1Ctx, id, canEdit);
	await written(
		ctx as D1Ctx,
		[ctx.d1.update(todos).set({ task_file_path: path }).where(eq(todos.id, id))],
		[boardId]
	);
}

/** A comment from the caller on the card; on D1 through the op, so the poll sees it. */
export const say = (ctx: UserCtx, todoId: string, content: string) =>
	(ctx.d1
		? callOp('createComment', ctx, { todoId, content })
		: serverRequest(CREATE_COMMENT, {
				objects: [{ todo_id: todoId, user_id: ctx.userId, content }]
			})
	).catch((err) => console.error('[github] comment failed:', err));
