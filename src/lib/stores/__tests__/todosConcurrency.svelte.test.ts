/** @file src/lib/stores/__tests__/todosConcurrency.svelte.test.ts */
// Races found in the production logs (#209): edits sent with an optimistic `temp-…`
// id, server rows written back to a stale index, and the 30 s poll re-downloading
// the whole board when nothing changed.
import { todosStore } from '../todos.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BoardTodo } from '$lib/types/todo';
import { call } from '$lib/api/call';

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

vi.mock('$lib/api/call', () => ({ call: vi.fn() }));

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

// The store's data API calls, as (op, input) pairs.
const calls = () => vi.mocked(call).mock.calls as unknown as [string, any][];
const mockCall = (impl: (op: string, input: any) => Promise<unknown>) =>
	vi.mocked(call).mockImplementation(impl as never);

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
		mockCall(async (op, input) => {
			switch (op) {
				case 'createTodo':
					return insert.promise;
				case 'updateTodo':
					return { ...created, ...input.set };
				default:
					return {};
			}
		});

		const adding = todosStore.addTodo('New card', undefined, 'list-1');
		await vi.waitFor(() => expect(todosStore.todos).toHaveLength(1));
		const tempId = todosStore.todos[0].id;
		expect(tempId).toMatch(/^temp-/);

		const updating = todosStore.updateTodo(tempId, { title: 'Renamed' });
		insert.resolve(created);

		const result = await updating;
		await adding;

		expect(result.success).toBe(true);
		const updates = calls().filter(([op]) => op === 'updateTodo');
		expect(updates).toHaveLength(1);
		expect(updates[0][1]).toMatchObject({ id: 'real-id', set: { title: 'Renamed' } });
		expect(todosStore.todos.map((t) => [t.id, t.title])).toEqual([['real-id', 'Renamed']]);
	});

	it('an edit to a card whose create failed is dropped, not sent', async () => {
		let failInsert!: (error: Error) => void;
		mockCall(async (op) =>
			op === 'createTodo' ? new Promise((_, reject) => (failInsert = reject)) : {}
		);

		const adding = todosStore.addTodo('Doomed', undefined, 'list-1');
		await vi.waitFor(() => expect(todosStore.todos).toHaveLength(1));
		const updating = todosStore.updateTodo(todosStore.todos[0].id, { title: 'x' });
		failInsert(new Error('insert failed'));
		const result = await updating;
		await adding;

		expect(result.success).toBe(false);
		expect(calls().some(([op]) => op === 'updateTodo')).toBe(false);
	});

	it('writes the server row back by id when the array was replaced meanwhile', async () => {
		todosStore.setTodosForTesting?.([todo({ id: 'a', title: 'A' }), todo({ id: 'b', title: 'B' })]);
		const update = deferred<unknown>();
		mockCall(async (op) => (op === 'updateTodo' ? update.promise : {}));

		const updating = todosStore.updateTodo('a', { title: 'A2' });
		// A poll lands in between with a different order: index 0 is now card b.
		todosStore.setTodosForTesting?.([todo({ id: 'b', title: 'B' }), todo({ id: 'a', title: 'A' })]);
		update.resolve(todo({ id: 'a', title: 'A2' }));
		await updating;

		expect(todosStore.todos.map((t) => [t.id, t.title])).toEqual([
			['b', 'B'],
			['a', 'A2']
		]);
	});

	it('parallel loads of the same board share one request', async () => {
		mockCall(async () => [todo({ id: 'a' })]);

		await Promise.all([
			todosStore.loadTodosInitial('board-1'),
			todosStore.loadTodosInitial('board-1'),
			todosStore.loadTodosRemaining('board-1'),
			todosStore.loadTodosRemaining('board-1')
		]);

		const pages = calls().map(([, input]) => `${input.completed}:${input.offset}`);
		expect(pages).toEqual(['false:0', 'false:50', 'true:0']);
		expect(todosStore.todos.map((t) => t.id)).toEqual(['a']);
	});

	describe('refreshBoardTodosIfChanged', () => {
		const board = 'board-1';
		// The board's hash, as the `poll` op returns it.
		let fingerprint: string;

		beforeEach(async () => {
			fingerprint = 'fp-1';
			mockCall(async (op) => (op === 'getTodos' ? [todo({ id: 'a' })] : {}));
			// The board must be the current one, or refreshBoardTodos discards the result.
			await todosStore.loadTodosInitial(board);
			vi.mocked(call).mockClear();
		});

		const fullFetches = () => calls().filter(([op]) => op === 'getTodos').length;

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
			const base = vi.mocked(call).getMockImplementation()! as any;
			mockCall(async (op, input) => (op === 'updateTodo' ? update.promise : base(op, input)));

			const moving = todosStore.updateTodo('a', { sort_order: 0 });
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(false);
			expect(todosStore.todos[0].sort_order).toBe(0);

			update.resolve(todo({ id: 'a', sort_order: 0 }));
			await moving;
			// Skipped, so the fingerprint was not recorded: the next poll refreshes.
			expect(await todosStore.refreshBoardTodosIfChanged(board, fingerprint)).toBe(true);
		});

		it('a poll whose fetch started before a write committed is dropped', async () => {
			const fetched = deferred<unknown>();
			const base = vi.mocked(call).getMockImplementation()! as any;
			mockCall(async (op, input) => {
				if (op === 'getTodos') return fetched.promise;
				if (op === 'updateTodo') return todo({ id: 'a', sort_order: 0 });
				return base(op, input);
			});

			const polling = todosStore.refreshBoardTodosIfChanged(board, fingerprint);
			await vi.waitFor(() => expect(fullFetches()).toBe(2));
			await todosStore.updateTodo('a', { sort_order: 0 });
			fetched.resolve([todo({ id: 'a', sort_order: 1 })]); // pre-write copy

			expect(await polling).toBe(false);
			expect(todosStore.todos[0].sort_order).toBe(0);
		});
	});
});
