/** @file src/lib/server/ops/__tests__/cards.test.ts */
// Card ops (#229): viewers read and comment, only editors change cards, strangers get 403;
// the server writes the activity rows and notifications and stamps the board.
import { describe, it, expect, vi } from 'vitest';
import { createTodo, deleteTodo, getTodo, getTodos, searchTodos, updateTodo } from '../todos';
import { assignUser, subscribeToTodo, unassignUser } from '../cardPeople';
import { addTodoLabel, createUpload, deleteUpload, removeTodoLabel } from '../cardExtras';
import { createComment, deleteComment, getComments, updateComment } from '../comments';
import { deleteNotification, markNotificationsRead } from '../notifications';
import { getBoardActivity } from '../activity';
import { cardActivity } from '../cardActivity';
import { OpError, type Op, type UserCtx } from '../op';

const B = '11111111-1111-4111-8111-111111111111';
const T = '22222222-2222-4222-8222-222222222222';
const ROW = '33333333-3333-4333-8333-333333333333';
const OTHER = '44444444-4444-4444-8444-444444444444';
const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

type Role = 'owner' | 'editor' | 'viewer' | 'public' | 'stranger';

const boardFor = (role: Role, userId = 'me') => ({
	user_id: role === 'owner' ? userId : 'someone',
	is_public: role === 'public',
	board_members: role === 'editor' || role === 'viewer' ? [{ role }] : []
});

/** The caller ('me') has `role` on board B, and card T is on it. */
function ctx(role: Role, answers: Record<string, unknown> = {}) {
	const card = {
		id: T,
		user_id: 'someone',
		list_id: ROW,
		title: 'Card',
		content: 'Body',
		completed_at: null,
		priority: null,
		due_on: null,
		has_time: false,
		assigned_to: null,
		assignees: [{ user_id: 'a1' }],
		subscribers: [{ user_id: 'a1' }, { user_id: 's1' }, { user_id: 'me' }],
		list: { name: 'Todo', board_id: B, board: boardFor(role) }
	};
	const defaults: Record<string, unknown> = {
		GetCardAccess: { todos_by_pk: card },
		GetBoardRole: { boards_by_pk: boardFor(role) },
		GetListBoard: { lists_by_pk: { board_id: B, name: 'Done' } },
		GetLabelBoard: { labels_by_pk: { board_id: B } },
		GetUploadTodo: { uploads_by_pk: { todo_id: T } },
		GetCommentAccess: { comments_by_pk: { id: ROW, user_id: 'me', todo_id: T, content: 'Hi' } },
		GetTodoDetails: { todos: [{ id: T, assignees: [] }] },
		GetTodos: { todos: [] },
		GetComments: { comments: [] },
		GetCommentsAggregate: { comments_aggregate: { aggregate: { count: 0 } } },
		CreateTodo: { insert_todos: { returning: [{ id: T }] } },
		UpdateTodos: { update_todos: { returning: [{ id: T }] } },
		DeleteTodos: { delete_todos: { affected_rows: 1 } },
		CreateComment: { insert_comments: { returning: [{ id: ROW }] } },
		UpdateComment: { update_comments: { returning: [{ id: ROW }] } },
		DeleteComment: { delete_comments: { affected_rows: 1 } },
		SearchTodoContent: { todos: [{ id: T }] },
		GetActivityLogs: { activity_logs: [] }
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests read the variables loosely
	const db = vi.fn<(doc: unknown, vars?: any) => Promise<unknown>>(
		async (doc) => ({ ...defaults, ...answers })[opName(doc)!] ?? {}
	);
	const sent = (name: string) => db.mock.calls.filter(([doc]) => opName(doc) === name);
	return { ctx: { userId: 'me', db } as unknown as UserCtx, db, sent };
}

async function run(op: Op, c: UserCtx, input: unknown) {
	return op.run(c, op.input.parse(input));
}

async function status(promise: Promise<unknown>) {
	try {
		await promise;
		return 'ok';
	} catch (error) {
		return error instanceof OpError ? error.status : error;
	}
}

const writes: [string, Op, unknown][] = [
	['createTodo', createTodo as Op, { listId: ROW, title: 'x', sort_order: 1 }],
	['updateTodo', updateTodo as Op, { id: T, set: { title: 'x' } }],
	['deleteTodo', deleteTodo as Op, { id: T }],
	['assignUser', assignUser as Op, { todoId: T, userId: OTHER }],
	['unassignUser', unassignUser as Op, { todoId: T, userId: OTHER }],
	['subscribeToTodo', subscribeToTodo as Op, { todoId: T, userId: OTHER }],
	['addTodoLabel', addTodoLabel as Op, { todoId: T, labelId: ROW }],
	['removeTodoLabel', removeTodoLabel as Op, { todoId: T, labelId: ROW }],
	['createUpload', createUpload as Op, { todoId: T, url: 'https://files.example.com/a.png' }],
	['deleteUpload', deleteUpload as Op, { id: ROW }]
];

describe('card writes: owners and editors only', () => {
	it.each(writes)('%s: an editor gets through and the board is stamped', async (_, op, input) => {
		const { ctx: c, sent } = ctx('editor');
		expect(await status(run(op, c, input))).toBe('ok');
		expect(sent('CardWritten')).toHaveLength(1);
		expect(sent('CardWritten')[0][1].boardIds).toEqual([B]);
	});

	it.each(writes)('%s: a viewer, a public visitor and a stranger get 403', async (_, op, input) => {
		for (const role of ['viewer', 'public', 'stranger'] as const) {
			const { ctx: c, sent } = ctx(role);
			expect(await status(run(op, c, input))).toBe(403);
			expect(sent('CardWritten')).toHaveLength(0);
		}
	});

	it('moving a card needs edit rights on the target board too, and stamps both', async () => {
		const target = '55555555-5555-4555-8555-555555555555';
		const answers = { GetListBoard: { lists_by_pk: { board_id: target, name: 'There' } } };
		const denied = ctx('editor', {
			...answers,
			GetBoardRole: { boards_by_pk: boardFor('viewer') }
		});
		expect(
			await status(run(updateTodo as Op, denied.ctx, { id: T, set: { list_id: OTHER } }))
		).toBe(403);

		const allowed = ctx('editor', {
			...answers,
			GetBoardRole: { boards_by_pk: boardFor('editor') }
		});
		await run(updateTodo as Op, allowed.ctx, { id: T, set: { list_id: OTHER } });
		const stamp = allowed.sent('CardWritten')[0][1];
		expect(stamp.boardIds).toEqual([B, target]);
		expect(stamp.logs[0]).toMatchObject({
			action_type: 'list_moved',
			old_value: 'Todo',
			new_value: 'There',
			user_id: 'me'
		});
	});

	it('rejects a column the app never writes', () => {
		expect(updateTodo.input.safeParse({ id: T, set: { user_id: OTHER } }).success).toBe(false);
	});

	it('a label from another board is refused', async () => {
		const { ctx: c } = ctx('editor', { GetLabelBoard: { labels_by_pk: { board_id: OTHER } } });
		expect(await status(run(addTodoLabel as Op, c, { todoId: T, labelId: ROW }))).toBe(400);
	});

	it('only a board member can be assigned', async () => {
		const { ctx: c } = ctx('editor', { GetBoardRole: { boards_by_pk: boardFor('stranger') } });
		expect(await status(run(assignUser as Op, c, { todoId: T, userId: OTHER }))).toBe(400);
	});
});

describe('card reads', () => {
	it.each(['owner', 'viewer', 'public'] as const)('%s reads the board cards', async (role) => {
		const { ctx: c } = ctx(role);
		expect(await status(run(getTodos as Op, c, { boardId: B }))).toBe('ok');
		expect(await status(run(getTodo as Op, c, { id: T }))).toBe('ok');
		expect(await status(run(searchTodos as Op, c, { boardId: B, term: '50%' }))).toBe('ok');
	});

	it('a stranger gets 403; a card that is gone is null', async () => {
		const { ctx: c } = ctx('stranger');
		expect(await status(run(getTodos as Op, c, { boardId: B }))).toBe(403);
		expect(await status(run(getTodo as Op, c, { id: T }))).toBe(403);
		const gone = ctx('owner', { GetCardAccess: { todos_by_pk: null } });
		expect(await run(getTodo as Op, gone.ctx, { id: T })).toBeNull();
	});

	it('search escapes LIKE wildcards', async () => {
		const { ctx: c, sent } = ctx('viewer');
		await run(searchTodos as Op, c, { boardId: B, term: '50%_off' });
		expect(sent('SearchTodoContent')[0][1].where.content).toEqual({ _ilike: '%50\\%\\_off%' });
	});

	it('without a board, only boards the caller owns or belongs to', async () => {
		const { ctx: c, sent } = ctx('owner');
		await run(getTodos as Op, c, { completed: true });
		const where = sent('GetTodos')[0][1].where;
		expect(where._and[0]).toEqual({ completed_at: { _is_null: false } });
		expect(JSON.stringify(where._and[1])).not.toContain('is_public');
	});

	it('the activity feed is for members only', async () => {
		expect(await status(run(getBoardActivity as Op, ctx('viewer').ctx, { boardId: B }))).toBe('ok');
		expect(await status(run(getBoardActivity as Op, ctx('public').ctx, { boardId: B }))).toBe(403);
	});
});

describe('card writes record their effects on the server', () => {
	it('createTodo assigns the creator and logs "created"', async () => {
		const { ctx: c, sent } = ctx('owner');
		await run(createTodo as Op, c, { listId: ROW, title: ' New ', sort_order: 5 });
		expect(sent('CreateTodo')[0][1].objects[0]).toMatchObject({
			list_id: ROW,
			title: 'New',
			user_id: 'me',
			assigned_to: 'me',
			assignees: { data: [{ user_id: 'me' }] }
		});
		expect(sent('CardWritten')[0][1].logs).toEqual([
			{ todo_id: T, action_type: 'created', user_id: 'me' }
		]);
	});

	it('assignUser makes the first assignee primary and notifies them', async () => {
		const { ctx: c, sent } = ctx('editor');
		await run(assignUser as Op, c, { todoId: T, userId: OTHER });
		expect(sent('UpdateTodos')[0][1]._set).toEqual({ assigned_to: OTHER });
		expect(sent('CardWritten')[0][1].notifications).toEqual([
			{ user_id: OTHER, todo_id: T, type: 'assigned', content: '', triggered_by_user_id: 'me' }
		]);
	});

	it('unassigning the primary promotes the next assignee', async () => {
		const { ctx: c, sent } = ctx('owner', {
			GetCardAccess: {
				todos_by_pk: {
					id: T,
					user_id: 'me',
					assigned_to: OTHER,
					assignees: [],
					subscribers: [],
					list: { board_id: B, board: boardFor('owner') }
				}
			},
			GetTodoDetails: { todos: [{ id: T, assignees: [{ user_id: 'next' }] }] }
		});
		await run(unassignUser as Op, c, { todoId: T, userId: OTHER });
		expect(sent('UpdateTodos')[0][1]._set).toEqual({ assigned_to: 'next' });
	});

	it('a sort_order-only move writes no activity row', async () => {
		const { ctx: c, sent } = ctx('editor');
		await run(updateTodo as Op, c, { id: T, set: { sort_order: 3 } });
		expect(sent('CardWritten')[0][1].logs).toEqual([]);
	});
});

describe('comments: viewers comment, authors edit', () => {
	it('a viewer reads and comments; assignees and subscribers are notified once, never the author', async () => {
		const { ctx: c, sent } = ctx('viewer');
		expect(await status(run(getComments as Op, c, { todoId: T }))).toBe('ok');
		await run(createComment as Op, c, { todoId: T, content: 'Hello' });
		const stamp = sent('CardWritten')[0][1];
		expect(stamp.logs[0]).toMatchObject({ action_type: 'commented', new_value: 'Hello' });
		expect(stamp.notifications.map((n: { user_id: string }) => n.user_id)).toEqual(['a1', 's1']);
		expect(stamp.notifications[0]).toMatchObject({
			type: 'commented',
			related_comment_id: ROW,
			content: '"Hello"',
			triggered_by_user_id: 'me'
		});
	});

	it('a public visitor cannot read or write comments', async () => {
		const { ctx: c } = ctx('public');
		expect(await status(run(getComments as Op, c, { todoId: T }))).toBe(403);
		expect(await status(run(createComment as Op, c, { todoId: T, content: 'x' }))).toBe(403);
	});

	it("only the author edits; a viewer deletes only their own; an editor deletes anyone's", async () => {
		const theirs = {
			GetCommentAccess: { comments_by_pk: { id: ROW, user_id: 'x', todo_id: T, content: 'a' } }
		};
		expect(
			await status(run(updateComment as Op, ctx('owner', theirs).ctx, { id: ROW, content: 'b' }))
		).toBe(403);
		expect(
			await status(run(updateComment as Op, ctx('viewer').ctx, { id: ROW, content: 'b' }))
		).toBe('ok');
		expect(await status(run(deleteComment as Op, ctx('viewer', theirs).ctx, { id: ROW }))).toBe(
			403
		);
		expect(await status(run(deleteComment as Op, ctx('viewer').ctx, { id: ROW }))).toBe('ok');
		expect(await status(run(deleteComment as Op, ctx('editor', theirs).ctx, { id: ROW }))).toBe(
			'ok'
		);
	});
});

describe('notifications: only the caller’s own', () => {
	it('mark read and delete are scoped to the session user', async () => {
		const { ctx: c, sent } = ctx('owner');
		await run(markNotificationsRead as Op, c, { ids: [ROW] });
		await run(deleteNotification as Op, c, { id: ROW });
		expect(sent('MarkMyNotificationsRead')[0][1]).toEqual({ userId: 'me', ids: [ROW] });
		expect(sent('DeleteMyNotification')[0][1]).toEqual({ userId: 'me', id: ROW });
	});
});

describe('cardActivity', () => {
	const old = { title: 'A', priority: null, list: { name: 'Todo' }, list_id: 'l1' } as never;

	it('logs nothing for a change that changes nothing', () => {
		expect(cardActivity(old, { title: 'A' })).toBeNull();
		expect(cardActivity(old, { sort_order: 1 } as never)).toBeNull();
	});

	it('logs completion first, then the other fields in order', () => {
		expect(cardActivity(old, { completed_at: 'now', title: 'B' })?.action_type).toBe('completed');
		expect(cardActivity(old, { title: 'B', content: 'x' })?.action_type).toBe('title_changed');
		expect(cardActivity(old, { priority: 'high' })).toMatchObject({
			old_value: 'none',
			new_value: 'high'
		});
	});
});
