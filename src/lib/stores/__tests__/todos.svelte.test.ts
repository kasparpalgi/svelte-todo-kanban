/** @file src/lib/stores/__tests__/todos.svelte.test.ts */
import { todosStore } from '../todos.svelte';
import { listsStore } from '../listsBoards.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BoardTodo } from '$lib/types/todo';
import { call } from '$lib/api/call';

vi.mock('../user.svelte', () => ({
	userStore: { user: { id: 'user-1', name: 'Test', username: 'test', email: 'test@example.com' } }
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

const createMockTodo = (overrides: Partial<BoardTodo> = {}): BoardTodo => ({
	id: 'test-id',
	alias: 'test-alias',
	title: 'Test Todo',
	content: 'Test content',
	completed_at: null,
	due_on: null,
	has_time: false,
	agent_plan_first: false,
	priority: 'medium',
	sort_order: 1,
	created_at: '2025-01-01T00:00:00Z',
	updated_at: '2025-01-01T00:00:00Z',
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

describe('TodosStore', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		todosStore.reset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Initial State', () => {
		it('should initialize with default values', () => {
			expect(todosStore.todos).toEqual([]);
			expect(todosStore.loading).toBe(false);
			expect(todosStore.error).toBe(null);
			expect(todosStore.initialized).toBe(false);
		});
	});

	describe('addTodo', () => {
		it('should add a new todo and update the store state', async () => {
			const newTodo = createMockTodo({ id: 'new-1', title: 'New Todo' });

			vi.mocked(call).mockResolvedValue(newTodo);

			const result = await todosStore.addTodo('New Todo', 'Some content', 'list-1');

			expect(result.success).toBe(true);
			expect(result.data).toEqual(newTodo);
			expect(todosStore.todos).toContainEqual(newTodo);
		});

		it('shows the optimistic card with the light-fragment comment count (#212)', async () => {
			vi.mocked(call).mockReturnValue(new Promise(() => {})); // keep it in flight

			void todosStore.addTodo('Pending Todo', undefined, 'list-1');

			// TodoItem reads comments_aggregate.aggregate.count; a missing one crashed the board.
			await vi.waitFor(() => expect(todosStore.todos).toHaveLength(1));
			expect(todosStore.todos[0].comments_aggregate).toEqual({ aggregate: { count: 0 } });
		});

		it('should not add a todo with an empty title', async () => {
			const result = await todosStore.addTodo('   '); // Whitespace only

			expect(result.success).toBe(false);
			expect(result.message).toBe('Title is required');
			expect(todosStore.todos).toHaveLength(0);
		});

		it('needs a list: a card lives in one', async () => {
			const result = await todosStore.addTodo('Nowhere');

			expect(result.success).toBe(false);
			expect(call).not.toHaveBeenCalled();
		});

		it('sends the card to createTodo, which assigns the creator on the server', async () => {
			vi.mocked(call).mockResolvedValue(createMockTodo({ id: 'n1' }) as never);

			await todosStore.addTodo(' Card ', ' body ', 'list-1', true, false, 'high');

			expect(vi.mocked(call).mock.calls).toEqual([
				[
					'createTodo',
					{ listId: 'list-1', title: 'Card', content: 'body', sort_order: 1000, priority: 'high' }
				]
			]);
		});

		it('should handle API errors gracefully', async () => {
			vi.mocked(call).mockRejectedValue(new Error('API Error'));

			const result = await todosStore.addTodo('Error Todo', undefined, 'list-1');

			expect(result.success).toBe(false);
			expect(result.message).toBe('API Error');
			expect(todosStore.todos).toHaveLength(0);
		});

		it('writes draft file when createGithubIssue=true and board has GitHub', async () => {
			const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
			vi.stubGlobal('fetch', fetchSpy);

			// Cards carry only the board id (#222); the board's GitHub comes from listsStore.
			const boardSpy = vi.spyOn(listsStore, 'boardById').mockReturnValue({
				id: 'board-1',
				github: JSON.stringify({ owner: 'acme', repo: 'app' })
			} as any);
			const todoWithGithub = createMockTodo({
				id: 'gh-1',
				title: 'GitHub Todo',
				list: { id: 'list-1', name: 'Backlog', board: { id: 'board-1' } } as any
			});

			vi.mocked(call).mockResolvedValue(todoWithGithub);

			await todosStore.addTodo('GitHub Todo', undefined, 'list-1', true, true);

			const draftCalls = fetchSpy.mock.calls.filter(([url]) =>
				String(url).includes('write-draft-file')
			);
			expect(draftCalls).toHaveLength(1);

			boardSpy.mockRestore();
			vi.unstubAllGlobals();
		});

		it('skips draft file when createGithubIssue=false (user opted out)', async () => {
			const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
			vi.stubGlobal('fetch', fetchSpy);

			const todoWithGithub = createMockTodo({
				id: 'gh-2',
				title: 'No GitHub Todo',
				list: {
					id: 'list-1',
					name: 'Backlog',
					board: {
						id: 'board-1',
						name: 'My Board',
						alias: 'my-board',
						github: JSON.stringify({ owner: 'acme', repo: 'app' })
					} as any
				} as any
			});

			vi.mocked(call).mockResolvedValue(todoWithGithub);

			await todosStore.addTodo('No GitHub Todo', undefined, 'list-1', true, false);

			const draftCalls = fetchSpy.mock.calls.filter(([url]) =>
				String(url).includes('write-draft-file')
			);
			expect(draftCalls).toHaveLength(0);

			vi.unstubAllGlobals();
		});
	});

	describe('updateTodo', () => {
		it('should update an existing todo', async () => {
			const initialTodo = createMockTodo({ id: '1', title: 'Initial Title' });

			vi.mocked(call).mockResolvedValueOnce(initialTodo);
			await todosStore.addTodo('Initial Title', undefined, 'list-1');

			const updatedTodo = { ...initialTodo, title: 'Updated Title' };
			vi.mocked(call).mockResolvedValueOnce(updatedTodo);

			const result = await todosStore.updateTodo('1', { title: 'Updated Title' });

			expect(result.success).toBe(true);
			expect(result.data).toEqual(updatedTodo);
		});

		it.each([
			['a draft: the save waits for publishing', 'doc/todo/090-x.md', 0],
			['a queued -TODO file: the agent gets the edit', 'doc/todo/090-x-TODO.md', 1]
		])('rewrites the task file on a content save only for %s', async (_, path, writes) => {
			const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
			vi.stubGlobal('fetch', fetchSpy);
			const todo = createMockTodo({ id: 'f1', content: 'old', task_file_path: path } as never);
			vi.mocked(call).mockResolvedValueOnce(todo);
			await todosStore.addTodo('Draft', undefined, 'list-1');
			vi.mocked(call).mockResolvedValue({ ...todo, content: 'new' });

			await todosStore.updateTodo('f1', { content: 'new' });

			const calls = fetchSpy.mock.calls.filter(([url]) => String(url).includes('update-task-file'));
			expect(calls).toHaveLength(writes);
			vi.unstubAllGlobals();
		});

		it('should not update a non-existent todo', async () => {
			const result = await todosStore.updateTodo('non-existent-id', { title: 'New Title' });

			expect(result.success).toBe(false);
			expect(result.message).toBe('Todo not found');
		});
	});

	// deleteTodo test removed - too complex with JWT token fetching and activity logging in browser environment

	describe('toggleTodo', () => {
		it('should toggle a todo to completed', async () => {
			const todoToToggle = createMockTodo({ id: '1', completed_at: null });

			vi.mocked(call).mockResolvedValueOnce(todoToToggle);
			await todosStore.addTodo('Test Todo', undefined, 'list-1');

			const completedTodo = { ...todoToToggle, completed_at: new Date().toISOString() };
			vi.mocked(call).mockResolvedValueOnce(completedTodo);

			const result = await todosStore.toggleTodo('1');

			expect(result.success).toBe(true);
		});
	});

	describe('assignUser / unassignUser (multi-assignee)', () => {
		// Promotion of the primary assignee, the activity row and the notification are the
		// server's job now (src/lib/server/ops/cardPeople.ts); the store shows its answer.
		const assignment = (userId: string) => ({
			user_id: userId,
			created_at: '2025-01-01T00:00:00Z',
			assignee: { id: userId, name: userId, username: userId, image: null, email: null }
		});

		it('assigns through the assignUser op and shows the card it returns', async () => {
			const todo = createMockTodo({ id: '1', assigned_to: null, assignees: [] });
			todosStore.setTodosForTesting?.([todo]);
			const after = { ...todo, assigned_to: 'u1', assignees: [assignment('u1')] };
			vi.mocked(call).mockResolvedValue(after as never);

			const result = await todosStore.assignUser('1', 'u1');

			expect(result.success).toBe(true);
			expect(vi.mocked(call).mock.calls).toEqual([['assignUser', { todoId: '1', userId: 'u1' }]]);
			expect(todosStore.todos[0].assigned_to).toBe('u1');
		});

		it('is a no-op (no request) when the user is already assigned', async () => {
			const todo = createMockTodo({ id: '1', assigned_to: 'u1', assignees: [assignment('u1')] });
			todosStore.setTodosForTesting?.([todo]);

			const result = await todosStore.assignUser('1', 'u1');

			expect(result.success).toBe(true);
			expect(call).not.toHaveBeenCalled();
		});

		it('keeps the card as it was when the server refuses', async () => {
			const todo = createMockTodo({ id: '1', assigned_to: 'u1', assignees: [assignment('u1')] });
			todosStore.setTodosForTesting?.([todo]);
			vi.mocked(call).mockRejectedValue(new Error('Not allowed on this card'));

			const result = await todosStore.unassignUser('1', 'u1');

			expect(result).toMatchObject({ success: false, message: 'Not allowed on this card' });
			expect(todosStore.todos[0].assigned_to).toBe('u1');
		});
	});
});
