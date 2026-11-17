/** @file src/lib/server/ops/d1/__tests__/cards.test.ts */
// The D1 card, comment, notification and activity ops on a real migrated SQLite: the
// access rules of the Hasura ops, the TodoFields shape, and what each write batch adds (#256).
import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { d1, type D1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { ops, type OpName } from '../../index';
import { OpError } from '../../op';
import { runOp } from '../../run';

const B = 'b0000000-0000-4000-8000-000000000001';
const L = 'c0000000-0000-4000-8000-000000000001';
const T1 = 'd0000000-0000-4000-8000-000000000001';
const T2 = 'd0000000-0000-4000-8000-000000000002';
const ME = 'a0000000-0000-4000-8000-000000000001';
const ANN = 'a0000000-0000-4000-8000-000000000002';
const VIEW = 'a0000000-0000-4000-8000-000000000003';

let sqlite: DatabaseSync;
let db: D1;

beforeEach(() => {
	sqlite = migratedSqlite();
	db = d1(sqliteD1(sqlite));
	sqlite.exec(`
		INSERT INTO users (id, username, email) VALUES
			('${ME}', 'me', 'me@x.ee'), ('${ANN}', 'ann', 'ann@x.ee'), ('${VIEW}', 'vic', 'vic@x.ee');
		INSERT INTO boards (id, user_id, name, alias) VALUES ('${B}', '${ME}', 'Mine', 'mine');
		INSERT INTO board_members (id, board_id, user_id, role) VALUES
			('m1', '${B}', '${ME}', 'owner'), ('m2', '${B}', '${ANN}', 'editor'), ('m3', '${B}', '${VIEW}', 'viewer');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES ('${L}', '${B}', 'Todo', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias, content, sort_order, due_on) VALUES
			('${T1}', '${ME}', '${L}', 'First', 'first', 'Says 100% HELLO', 1, NULL),
			('${T2}', '${ME}', '${L}', 'Second', 'second', NULL, 1, '2026-12-01T00:00:00.000Z');
		INSERT INTO todo_assignees (todo_id, user_id, created_at) VALUES
			('${T1}', '${ANN}', '2026-01-02T00:00:00.000Z'), ('${T1}', '${ME}', '2026-01-01T00:00:00.000Z');
		INSERT INTO claude_usage (id, session_id, todo_id, user_id, model, cost_usd) VALUES
			('u1', 's1', '${T1}', '${ME}', 'm', 0.1), ('u2', 's2', '${T1}', '${ME}', 'm', 0.2);`);
});

const run = (name: OpName, input: unknown, userId = ME) =>
	runOp(name, { userId, db: async () => ({}) as never, d1: db }, ops[name].input.parse(input));

async function status(promise: Promise<unknown>) {
	try {
		await promise;
		return 200;
	} catch (e) {
		if (e instanceof OpError) return e.status;
		throw e;
	}
}

const rows = (sql: string) => sqlite.prepare(sql).all();

describe('reads', () => {
	it('returns TodoFields: primary = oldest assignee, aggregates, preview, nulls first', async () => {
		const cards = (await run('getTodos', { boardId: B })) as Record<string, unknown>[];
		expect(cards.map((c) => c.alias)).toEqual(['first', 'second']);
		expect(cards[0]).toMatchObject({
			assigned_to: ME,
			assignee: { username: 'me' },
			content_preview: 'Says 100% HELLO',
			has_time: false,
			claude_usages_aggregate: { aggregate: { sum: { cost_usd: 0.3 } } },
			comments_aggregate: { aggregate: { count: 0 } },
			list: { id: L, name: 'Todo', board: { id: B } }
		});
		expect(cards[0]).not.toHaveProperty('content');
		expect(cards[1]).toMatchObject({ assigned_to: null, assignee: null });
	});

	it('a viewer reads, a stranger does not; search is case-insensitive and literal', async () => {
		sqlite.exec(`INSERT INTO users (id, username) VALUES ('x', 'x')`);
		expect(await status(run('getTodos', { boardId: B }, VIEW))).toBe(200);
		expect(await status(run('getTodos', { boardId: B }, 'x'))).toBe(403);
		expect(await status(run('getTodo', { id: T1 }, 'x'))).toBe(403);
		expect(await run('getTodo', { id: L })).toBeNull();
		expect(await run('searchTodos', { boardId: B, term: 'hello' })).toEqual([T1]);
		expect(await run('searchTodos', { boardId: B, term: '0%' })).toEqual([T1]);
		expect(await run('searchTodos', { boardId: B, term: 'x%' })).toEqual([]);
	});
});

describe('card writes', () => {
	it('createTodo: per-user alias suffix, creator assigned, log and stamp in the batch', async () => {
		const card = (await run('createTodo', { listId: L, title: 'First', sort_order: 0 })) as {
			alias: string;
			assigned_to: string;
		};
		expect(card).toMatchObject({ alias: 'first1', assigned_to: ME, content: null });
		expect(rows(`SELECT action_type, user_id FROM activity_logs`)).toEqual([
			{ action_type: 'created', user_id: ME }
		]);
		expect(rows(`SELECT changed_at FROM boards`)[0]).not.toEqual({ changed_at: null });
		expect(await status(run('createTodo', { listId: L, title: 'x', sort_order: 0 }, VIEW))).toBe(
			403
		);
	});

	it('updateTodo: ISO times, one activity row, and no assigned_to', async () => {
		const card = await run('updateTodo', {
			id: T1,
			set: { priority: 'high', due_on: '2026-12-01T10:00:00+02:00' }
		});
		expect(card).toMatchObject({ priority: 'high', due_on: '2026-12-01T08:00:00.000Z' });
		expect(rows(`SELECT action_type, old_value, new_value FROM activity_logs`)).toEqual([
			{ action_type: 'priority_changed', old_value: 'none', new_value: 'high' }
		]);
		expect(await status(run('updateTodo', { id: T1, set: { assigned_to: ANN } }))).toBe(400);
		expect(await status(run('updateTodo', { id: T1, set: { title: 'x' } }, VIEW))).toBe(403);
	});

	it('unassigning the primary hands it to the next oldest; assigning notifies', async () => {
		const after = (await run('unassignUser', { todoId: T1, userId: ME })) as {
			assigned_to: string;
		};
		expect(after.assigned_to).toBe(ANN);
		await run('assignUser', { todoId: T2, userId: ANN });
		expect(rows(`SELECT user_id, type, triggered_by_user_id FROM notifications`)).toEqual([
			{ user_id: ANN, type: 'assigned', triggered_by_user_id: ME }
		]);
	});

	it('deleteTodo reports whether it deleted', async () => {
		expect(await run('deleteTodo', { id: T2 })).toEqual({ deleted: true });
		expect(await status(run('deleteTodo', { id: T2 }))).toBe(404);
	});
});

describe('comments, notifications and activity', () => {
	it('createComment notifies assignees and subscribers, never the author', async () => {
		sqlite.exec(`INSERT INTO todo_subscribers (todo_id, user_id) VALUES ('${T1}', '${VIEW}')`);
		const comment = (await run('createComment', { todoId: T1, content: 'Hi' }, VIEW)) as {
			id: string;
		};
		expect(comment).toMatchObject({ content: 'Hi', user: { username: 'vic' } });
		expect(rows(`SELECT user_id, content FROM notifications ORDER BY user_id`)).toEqual([
			{ user_id: ME, content: '"Hi"' },
			{ user_id: ANN, content: '"Hi"' }
		]);
		expect(await run('getComments', { todoId: T1 })).toMatchObject({ total: 1 });
		expect(await status(run('updateComment', { id: comment.id, content: 'x' }))).toBe(403);
	});

	it('notifications are the caller’s own; activity is for board members', async () => {
		await run('assignUser', { todoId: T2, userId: ANN });
		const [mine] = (await run('getNotifications', {}, ANN)) as { id: string }[];
		expect(mine).toMatchObject({ todo: { title: 'Second', list: { board: { alias: 'mine' } } } });
		expect(await run('markNotificationsRead', { ids: [mine.id] })).toEqual({ updated: 0 });
		expect(await run('markNotificationsRead', { ids: [mine.id] }, ANN)).toEqual({ updated: 1 });
		expect(await run('deleteNotification', { id: mine.id }, ANN)).toEqual({ deleted: true });
		const feed = (await run('getBoardActivity', { boardId: B })) as { action_type: string }[];
		expect(feed.map((a) => a.action_type)).toEqual(['assigned']);
	});
});
