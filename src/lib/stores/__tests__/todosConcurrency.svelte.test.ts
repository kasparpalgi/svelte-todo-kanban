/** @file src/lib/stores/__tests__/todosConcurrency.svelte.test.ts */
// Races found in the production logs (#209): edits sent with an optimistic `temp-…`
// id, server rows written back to a stale index, and the 30 s poll re-downloading
// the whole board when nothing changed.
import { todosStore } from '../todos.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BoardTodo } from '$lib/types/todo';
import { request } from '$lib/graphql/client';

vi.mock('../user.svelte', () => ({
	userStore: {
		user: { id: 'user-1', name: 'Test', username: 'test', email: 'test@example.com', plan: 'paid' }
	}
}));

vi.mock('$lib/config/plan', () => ({
	isPaid: () => true,
	FREE_LIMITS: { uncompletedCardsPerBoard: 1000 }
}));

vi.mock('$env/static/public', () => ({
	PUBLIC_API_ENDPOINT: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENDPOINT_DEV: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENV: 'development'
}));

vi.mock('$lib/graphql/client', () => ({ request: vi.fn() }));

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: '1.0.0'
}));

const todo = (overrides: Partial<BoardTodo> = {}): BoardTodo => ({
	id: 'todo-1',
	alias: 'alias',
	title: 'Todo',
	content: null,
	completed_at: null,
	due_on: null,
	has_time: false,
	agent_plan_first: false,
	priority: null,
	sort_order: 1,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	list: null,
	uploads: [],
	labels: [],
	comments_aggregate: { aggregate: { count: 0 } },
	assignees: [],
	subscribers: [],
	claude_usages_aggregate: { aggregate: null },
	__typename: 'todos',
	...overrides
});

/** Name of the GraphQL operation a request() call was made with. */
const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((r) => (resolve = r));
	return { promise, resolve };
}

describe('todosStore races (#209)', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		todosStore.reset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('an edit made while the card is still being created waits for its real id', async () => {
		const created = todo({ id: 'real-id', title: 'New card' });
		const insert = deferred<unknown>();
		vi.mocked(request).mockImplementation(async (doc: any, vars: any) => {
			switch (opName(doc)) {
				case 'CreateTodo':
					return insert.promise;
				case 'UpdateTodos':
					return { update_todos: { returning: [{ ...created, ...vars._set }] } };
				default:
					return {};
			}
		});

		const adding = todosStore.addTodo('New card');
		await vi.waitFor(() => expect(todosStore.todos).toHaveLength(1));
		const tempId = todosStore.todos[0].id;
		expect(tempId).toMatch(/^temp-/);

		const updating = todosStore.updateTodo(tempId, { title: 'Renamed' });
		insert.resolve({ insert_todos: { returning: [created] } });

		const result = await updating;
		await adding;

		expect(result.success).toBe(true);
		const updates = vi.mocked(request).mock.calls.filter(([doc]) => opName(doc) === 'UpdateTodos');
		expect(updates).toHaveLength(1);
		expect(updates[0][1]).toMatchObject({ where: { id: { _eq: 'real-id' } } });
		expect(todosStore.todos.map((t) => [t.id, t.title])).toEqual([['real-id', 'Renamed']]);
	});

	it('an edit to a card whose create failed is dropped, not sent', async () => {
		let failInsert!: (error: Error) => void;
		vi.mocked(request).mockImplementation(async (doc: any) =>
			opName(doc) === 'CreateTodo' ? new Promise((_, reject) => (failInsert = reject)) : ({} as any)
		);

		const adding = todosStore.addTodo('Doomed');
		await vi.waitFor(() => expect(todosStore.todos).toHaveLength(1));
		const updating = todosStore.updateTodo(todosStore.todos[0].id, { title: 'x' });
		failInsert(new Error('insert failed'));
		const result = await updating;
		await adding;

		expect(result.success).toBe(false);
		expect(vi.mocked(request).mock.calls.some(([doc]) => opName(doc) === 'UpdateTodos')).toBe(
			false
		);
	});

	it('writes the server row back by id when the array was replaced meanwhile', async () => {
		todosStore.setTodosForTesting?.([todo({ id: 'a', title: 'A' }), todo({ id: 'b', title: 'B' })]);
		const update = deferred<unknown>();
		vi.mocked(request).mockImplementation(async (doc: any) =>
			opName(doc) === 'UpdateTodos' ? update.promise : {}
		);

		const updating = todosStore.updateTodo('a', { title: 'A2' });
		// A poll lands in between with a different order: index 0 is now card b.
		todosStore.setTodosForTesting?.([todo({ id: 'b', title: 'B' }), todo({ id: 'a', title: 'A' })]);
		update.resolve({ update_todos: { returning: [todo({ id: 'a', title: 'A2' })] } });
		await updating;

		expect(todosStore.todos.map((t) => [t.id, t.title])).toEqual([
			['b', 'B'],
			['a', 'A2']
		]);
	});

	describe('refreshBoardTodosIfChanged', () => {
		const board = 'board-1';
		// The board's hash, as the `poll` op returns it.
		let fingerprint: string;

		beforeEach(async () => {
			fingerprint = 'fp-1';
			vi.mocked(request).mockImplementation(async (doc: any) => {
				switch (opName(doc)) {
					case 'GetTodos':
						return { todos: [todo({ id: 'a' })] };
					case 'GetLists':
						return { lists: [] };
					default:
						return {};
				}
			});
			// The board must be the current one, or refreshBoardTodos discards the result.
			await todosStore.loadTodosInitial(board);
			vi.mocked(request).mockClear();
		});

		const fullFetches = () =>
			vi.mocked(request).mock.calls.filter(([doc]) => opName(doc) === 'GetTodos').length;

		it('downloads the full board on the first poll, then only when the fingerprint changes', async () => {
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(true);
			expect(fullFetches()).toBe(2); // active + completed

			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(false);
			expect(fullFetches()).toBe(2);

			fingerprint = 'fp-2';
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(true);
			expect(fullFetches()).toBe(4);
		});

		it('still refreshes in full every 5 minutes, for what the fingerprint cannot see', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			await todosStore.refreshBoardTodosIfChanged(board, fingerprint);
			vi.setSystemTime(Date.now() + 4 * 60 * 1000);
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(false);
			vi.setSystemTime(Date.now() + 2 * 60 * 1000);
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(true);
			expect(fullFetches()).toBe(4);
		});

		// #223: a drag/Ctrl+Arrow move is an optimistic sort_order write. A poll that
		// fetched before it committed must not put the card back where it was.
		it('a poll does not overwrite a sort_order write still in flight', async () => {
			const update = deferred<unknown>();
			const base = vi.mocked(request).getMockImplementation()!;
			vi.mocked(request).mockImplementation(async (doc: any, vars: any) =>
				opName(doc) === 'UpdateTodos' ? update.promise : base(doc, vars)
			);

			const moving = todosStore.updateTodo('a', { sort_order: 0 });
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(false);
			expect(todosStore.todos[0].sort_order).toBe(0);

			update.resolve({ update_todos: { returning: [todo({ id: 'a', sort_order: 0 })] } });
			await moving;
			// Skipped, so the fingerprint was not recorded: the next poll refreshes.
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(true);
		});

		it('a poll whose fetch started before a write committed is dropped', async () => {
			const fetched = deferred<unknown>();
			const base = vi.mocked(request).getMockImplementation()!;
			vi.mocked(request).mockImplementation(async (doc: any, vars: any) => {
				if (opName(doc) === 'GetTodos') return fetched.promise;
				if (opName(doc) === 'UpdateTodos')
					return { update_todos: { returning: [todo({ id: 'a', sort_order: 0 })] } };
				return base(doc, vars);
			});

			const polling = todosStore.refreshBoardTodosIfChanged(board, fingerprint);
			await vi.waitFor(() => expect(fullFetches()).toBe(2));
			await todosStore.updateTodo('a', { sort_order: 0 });
			fetched.resolve({ todos: [todo({ id: 'a', sort_order: 1 })] }); // pre-write copy

			expect(await polling).toBe(false);
			expect(todosStore.todos[0].sort_order).toBe(0);
		});
	});
});
