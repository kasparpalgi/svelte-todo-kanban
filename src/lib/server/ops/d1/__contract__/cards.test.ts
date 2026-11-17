/** @file src/lib/server/ops/d1/__contract__/cards.test.ts */
// Contract tests for the card, comment, notification and activity ops (#256). Same setup
// as contract.test.ts. CONTRACT_WRITES=1 also writes on the test user's tests-board on
// both sides and deletes what it made (production has the rows for seconds).
import { describe, expect, it } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import { ops, type OpName } from '../../index';
import { runOp } from '../../run';
import { compare, type Case } from './cases';
import { normalize } from './compare';
import { local } from './local';

const on = !!process.env.CONTRACT;
const VOLATILE =
	/^(id|todo_id|list_id|label_id|related_comment_id|created_at|updated_at|github_synced_at)$/;

describe.skipIf(!on)('D1 card ops equal Hasura', () => {
	const { sqlite, db } = on ? local() : ({} as ReturnType<typeof local>);
	const all = <T>(sql: string) => (on ? (sqlite.prepare(sql).all() as T[]) : []);
	const users = all<{ id: string }>(`SELECT id FROM users`);
	const boards = all<{ id: string; user_id: string }>(`SELECT id, user_id FROM boards`);
	const test = all<{ id: string; board: string }>(
		`SELECT u.id, b.id AS board FROM users u JOIN boards b ON b.user_id = u.id
		 WHERE u.username = 'test' AND b.alias = 'tests-board'`
	)[0];
	const long = { timeout: 600_000 };

	it('getTodos for every board as its owner, open and completed, and per user', long, async () => {
		const cases: Case[] = boards.flatMap((b) =>
			[{}, { completed: true }, { limit: 1000 }].map((page) => ({
				op: 'getTodos' as const,
				userId: b.user_id,
				input: { boardId: b.id, ...page }
			}))
		);
		cases.push(...users.map(({ id }) => ({ op: 'getTodos' as const, userId: id, input: {} })));
		expect(await compare(cases, db)).toEqual([]);
	});

	it('getTodo for every card as its board owner, and as the test user', long, async () => {
		const cards = all<{ id: string; owner: string }>(
			`SELECT t.id, coalesce(b.user_id, t.user_id) AS owner FROM todos t
			 LEFT JOIN lists l ON l.id = t.list_id LEFT JOIN boards b ON b.id = l.board_id`
		);
		const cases = cards.map((c) => ({
			op: 'getTodo' as const,
			userId: c.owner,
			input: { id: c.id }
		}));
		cases.push(
			...cards.slice(0, 50).map((c) => ({ ...cases[0], userId: test.id, input: { id: c.id } }))
		);
		expect(await compare(cases, db)).toEqual([]);
	});

	it('getComments, getBoardActivity and getNotifications', long, async () => {
		const commented = all<{ todo_id: string; owner: string }>(
			`SELECT c.todo_id, b.user_id AS owner FROM comments c JOIN todos t ON t.id = c.todo_id
			 JOIN lists l ON l.id = t.list_id JOIN boards b ON b.id = l.board_id
			 GROUP BY c.todo_id ORDER BY count(*) DESC LIMIT 100`
		);
		const cases: Case[] = commented.flatMap((c) =>
			[{}, { limit: 3, offset: 2 }].map((page) => ({
				op: 'getComments' as const,
				userId: c.owner,
				input: { todoId: c.todo_id, ...page }
			}))
		);
		cases.push(
			...boards.flatMap((b) => [
				{ op: 'getBoardActivity' as const, userId: b.user_id, input: { boardId: b.id } },
				{ op: 'getBoardActivity' as const, userId: test.id, input: { boardId: b.id } }
			]),
			...users.map(({ id }) => ({ op: 'getNotifications' as const, userId: id, input: {} }))
		);
		expect(await compare(cases, db)).toEqual([]);
	});

	it('searchTodos finds the same cards (in any order)', long, async () => {
		const cases = boards.flatMap((b) =>
			['the', 'HTTP', '100%'].map((term) => ({
				op: 'searchTodos' as const,
				userId: b.user_id,
				input: { boardId: b.id, term }
			}))
		);
		const sorted = (c: Case, d1: boolean) =>
			runOp(
				c.op,
				{ userId: c.userId, db: serverRequest, ...(d1 && { d1: db }) },
				ops[c.op].input.parse(c.input)
			).then((ids) => (ids as string[]).sort());
		const failed: string[] = [];
		for (const c of cases) {
			const [h, l] = await Promise.all([sorted(c, false), sorted(c, true)]);
			if (JSON.stringify(h) !== JSON.stringify(l))
				failed.push(`${JSON.stringify(c.input)}: ${h.length} ≠ ${l.length}`);
		}
		expect(failed).toEqual([]);
	});

	it.skipIf(!process.env.CONTRACT_WRITES)(
		'writes as the test user on tests-board',
		long,
		async () => {
			const ctx = (side: number) => ({
				userId: test.id,
				db: serverRequest,
				...(side && { d1: db })
			});
			const strip = (v: unknown) =>
				JSON.parse(JSON.stringify(normalize(v), (k, x) => (VOLATILE.test(k) ? undefined : x)));
			/** Runs `op` on Hasura (0) and D1 (1), each with its own input; expects equal JSON. */
			async function pair<T = { id: string }>(op: OpName, input: (side: number) => unknown) {
				const out = (await Promise.all(
					[0, 1].map((s) => runOp(op, ctx(s), ops[op].input.parse(input(s))))
				)) as T[];
				expect(strip(out[1]), op).toEqual(strip(out[0]));
				return out;
			}
			const title = `Contract card ${Date.now()}`;
			const list = await pair('createList', () => ({
				boardId: test.board,
				name: title,
				sort_order: 9
			}));
			try {
				const card = await pair('createTodo', (s) => ({
					listId: list[s].id,
					title,
					sort_order: 99
				}));
				const id = (s: number) => card[s].id;
				await pair('updateTodo', (s) => ({
					id: id(s),
					set: {
						title: `${title} 2`,
						priority: 'high',
						due_on: '2026-12-01T10:00:00+02:00',
						has_time: true
					}
				}));
				await pair('updateTodo', (s) => ({ id: id(s), set: { min_hours: 1, max_hours: 2.5 } }));
				await pair('updateTodo', (s) => ({
					id: id(s),
					set: { completed_at: '2026-11-17T08:00:00Z' }
				}));
				await pair('getTodo', (s) => ({ id: id(s) }));

				const comment = await pair('createComment', (s) => ({
					todoId: id(s),
					content: 'First "quoted" comment'
				}));
				await pair('updateComment', (s) => ({ id: comment[s].id, content: 'Edited comment' }));
				await pair('getComments', (s) => ({ todoId: id(s) }));
				await pair('deleteComment', (s) => ({ id: comment[s].id }));

				await pair('unassignUser', (s) => ({ todoId: id(s), userId: test.id }));
				await pair('assignUser', (s) => ({ todoId: id(s), userId: test.id }));
				await pair('subscribeToTodo', (s) => ({ todoId: id(s), userId: test.id }));
				await pair('unsubscribeFromTodo', (s) => ({ todoId: id(s), userId: test.id }));

				const label = await pair('createLabel', () => ({
					boardId: test.board,
					name: title,
					color: '#123456'
				}));
				await pair('addTodoLabel', (s) => ({ todoId: id(s), labelId: label[s].id }));
				await pair('removeTodoLabel', (s) => ({ todoId: id(s), labelId: label[s].id }));
				await pair('deleteLabel', (s) => ({ id: label[s].id }));

				const url = 'https://example.com/contract.png';
				const withImage = await pair<{ uploads: { id: string }[] }>('createUpload', (s) => ({
					todoId: id(s),
					url
				}));
				await pair('deleteUpload', (s) => ({ id: withImage[s].uploads[0].id }));

				const feed = await pair<{ todo_id: string; action_type: string }[]>(
					'getBoardActivity',
					() => ({
						boardId: test.board,
						limit: 12
					})
				);
				expect(feed[1].map((a) => a.action_type)).toContain('image_removed');
				await pair('deleteTodo', (s) => ({ id: id(s) }));
				await pair('deleteList', (s) => ({ id: list[s].id }));
			} finally {
				// Leave nothing on production tests-board, even after a failed step.
				const gone = (s: number) =>
					runOp('deleteList', ctx(s), { id: list[s].id }).catch(() => null);
				await Promise.all([gone(0), gone(1)]);
			}
		}
	);
});
