/** @file src/lib/stores/__tests__/lightBoard.svelte.test.ts */
// The board loads cards without their body or comments (#211); an opened card fetches
// the body, and "search in content" asks Postgres.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { todosStore } from '../todos.svelte';
import { contentSearch, escapeLike } from '../contentSearch.svelte';
import { request } from '$lib/graphql/client';
import type { BoardTodo } from '$lib/types/todo';

vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false }));
vi.mock('$lib/graphql/client', () => ({ request: vi.fn() }));
vi.mock('../user.svelte', () => ({ userStore: { user: { id: 'user-1', plan: 'paid' } } }));

const card = (overrides: Partial<BoardTodo> = {}): BoardTodo => ({
	id: 'todo-1',
	alias: 'alias',
	title: 'Todo',
	content_preview: 'Body',
	has_time: false,
	agent_plan_first: false,
	sort_order: 1,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
	uploads: [],
	labels: [],
	comments_aggregate: { aggregate: { count: 2 } },
	assignees: [],
	subscribers: [],
	claude_usages_aggregate: { aggregate: null },
	__typename: 'todos',
	...overrides
});

const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

/** Serve GetTodos with `board` and GetTodoDetails with the full card. */
function serve(board: () => BoardTodo[], details: BoardTodo) {
	vi.mocked(request).mockImplementation(async (doc: any, vars: any) => {
		if (opName(doc) === 'GetTodoDetails') return { todos: [details] };
		if (opName(doc) === 'GetTodos')
			return { todos: vars.where.completed_at._is_null === false ? [] : board() };
		return {};
	});
}

describe('light board query (#211)', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		todosStore.reset();
	});

	it('an opened card keeps its body across a poll until the card changes', async () => {
		let board = [card()];
		serve(() => board, card({ content: 'Full body' }));

		await todosStore.loadTodosInitial('board-1');
		expect(todosStore.todos[0].content).toBeUndefined();

		await todosStore.loadTodoDetails('todo-1');
		expect(todosStore.todos[0].content).toBe('Full body');

		await todosStore.refreshBoardTodos('board-1');
		expect(todosStore.todos[0].content).toBe('Full body');

		board = [card({ updated_at: '2026-01-02T00:00:00Z' })];
		await todosStore.refreshBoardTodos('board-1');
		expect(todosStore.todos[0].content).toBeUndefined();
	});
});

describe('content search (#211)', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		contentSearch.sync(null, undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('escapes LIKE wildcards', () => {
		expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
	});

	it('asks Postgres for the board cards whose body matches', async () => {
		vi.mocked(request).mockResolvedValue({ todos: [{ id: 'todo-9' }] });

		contentSearch.sync('board-1', 'needle');
		expect(request).not.toHaveBeenCalled(); // debounced
		await vi.advanceTimersByTimeAsync(300);

		expect(vi.mocked(request).mock.calls[0][1]).toEqual({
			where: { list: { board_id: { _eq: 'board-1' } }, content: { _ilike: '%needle%' } }
		});
		expect(contentSearch.has('todo-9')).toBe(true);

		contentSearch.sync('board-1', undefined);
		expect(contentSearch.has('todo-9')).toBe(false);
	});
});
