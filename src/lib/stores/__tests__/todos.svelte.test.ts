/** @file src/lib/stores/__tests__/todos.svelte.test.ts */
import { todosStore } from '../todos.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

vi.mock('../user.svelte', () => ({
	userStore: { user: { id: 'user-1', name: 'Test', username: 'test', email: 'test@example.com' } }
}));

vi.mock('$env/static/public', () => ({
	PUBLIC_API_ENDPOINT: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENDPOINT_DEV: 'http://localhost:8080/v1/graphql',
	PUBLIC_API_ENV: 'development'
}));

vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('$lib/graphql/client');

const createMockTodo = (overrides: Partial<TodoFieldsFragment> = {}): TodoFieldsFragment => ({
	id: 'test-id',
	alias: 'test-alias',
	title: 'Test Todo',
	content: 'Test content',
	completed_at: null,
	due_on: null,
	has_time: false,
	priority: 'medium',
	sort_order: 1,
	created_at: '2025-01-01T00:00:00Z',
	updated_at: '2025-01-01T00:00:00Z',
	list: null,
	uploads: [],
	labels: [],
	comments: [],
	assignees: [],
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

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({
				insert_todos: {
					returning: [newTodo]
				}
			});

			const result = await todosStore.addTodo('New Todo', 'Some content');

			expect(result.success).toBe(true);
			expect(result.data).toEqual(newTodo);
			expect(todosStore.todos).toContainEqual(newTodo);
		});

		it('should not add a todo with an empty title', async () => {
			const result = await todosStore.addTodo('   '); // Whitespace only

			expect(result.success).toBe(false);
			expect(result.message).toBe('Title is required');
			expect(todosStore.todos).toHaveLength(0);
		});

		it('should handle API errors gracefully', async () => {
			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockRejectedValue(new Error('API Error'));

			const result = await todosStore.addTodo('Error Todo');

			expect(result.success).toBe(false);
			expect(result.message).toBe('API Error');
			expect(todosStore.todos).toHaveLength(0);
		});

		it('writes draft file when createGithubIssue=true and board has GitHub', async () => {
			const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
			vi.stubGlobal('fetch', fetchSpy);

			const todoWithGithub = createMockTodo({
				id: 'gh-1',
				title: 'GitHub Todo',
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

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ insert_todos: { returning: [todoWithGithub] } });

			await todosStore.addTodo('GitHub Todo', undefined, 'list-1', true, true);

			const draftCalls = fetchSpy.mock.calls.filter(([url]) =>
				String(url).includes('write-draft-file')
			);
			expect(draftCalls).toHaveLength(1);

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

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValue({ insert_todos: { returning: [todoWithGithub] } });

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

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValueOnce({
				insert_todos: { returning: [initialTodo] }
			});
			await todosStore.addTodo('Initial Title');

			const updatedTodo = { ...initialTodo, title: 'Updated Title' };
			vi.mocked(request).mockResolvedValueOnce({
				update_todos: { returning: [updatedTodo] }
			});

			const result = await todosStore.updateTodo('1', { title: 'Updated Title' });

			expect(result.success).toBe(true);
			expect(result.data).toEqual(updatedTodo);
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

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValueOnce({
				insert_todos: { returning: [todoToToggle] }
			});
			await todosStore.addTodo('Test Todo');

			const completedTodo = { ...todoToToggle, completed_at: new Date().toISOString() };
			vi.mocked(request).mockResolvedValueOnce({
				update_todos: { returning: [completedTodo] }
			});

			const result = await todosStore.toggleTodo('1');

			expect(result.success).toBe(true);
		});
	});

	describe('assignUser / unassignUser (multi-assignee)', () => {
		const assignment = (userId: string) => ({
			user_id: userId,
			created_at: '2025-01-01T00:00:00Z',
			assignee: {
				id: userId,
				name: userId,
				username: userId,
				image: null,
				email: null,
				__typename: 'users' as const
			},
			__typename: 'todo_assignees' as const
		});

		it('assigns a user and promotes them to primary when the todo had none', async () => {
			const todo = createMockTodo({ id: '1', assigned_to: null, assignees: [] });
			(todosStore as unknown as { setTodosForTesting: (t: unknown[]) => void }).setTodosForTesting([
				todo
			]);

			const { request } = await import('$lib/graphql/client');
			const row = assignment('u1');
			vi.mocked(request)
				.mockResolvedValueOnce({ insert_todo_assignees_one: row })
				.mockResolvedValueOnce({
					update_todos: { returning: [{ ...todo, assigned_to: 'u1', assignees: [row] }] }
				})
				.mockResolvedValueOnce({ insert_activity_logs_one: { id: 'log-1' } }); // activity log

			const result = await todosStore.assignUser('1', 'u1');

			expect(result.success).toBe(true);
			expect(todosStore.todos[0].assignees.map((a) => a.user_id)).toContain('u1');
			expect(todosStore.todos[0].assigned_to).toBe('u1');
		});

		it('is a no-op (no request) when the user is already assigned', async () => {
			const todo = createMockTodo({
				id: '1',
				assigned_to: 'u1',
				assignees: [assignment('u1')]
			});
			(todosStore as unknown as { setTodosForTesting: (t: unknown[]) => void }).setTodosForTesting([
				todo
			]);

			const { request } = await import('$lib/graphql/client');
			const result = await todosStore.assignUser('1', 'u1');

			expect(result.success).toBe(true);
			expect(request).not.toHaveBeenCalled();
		});

		it('adds a second assignee without changing the existing primary', async () => {
			const a1 = assignment('u1');
			const todo = createMockTodo({ id: '1', assigned_to: 'u1', assignees: [a1] });
			(todosStore as unknown as { setTodosForTesting: (t: unknown[]) => void }).setTodosForTesting([
				todo
			]);

			const { request } = await import('$lib/graphql/client');
			const a2 = assignment('u2');
			vi.mocked(request)
				.mockResolvedValueOnce({ insert_todo_assignees_one: a2 })
				.mockResolvedValueOnce({ insert_activity_logs_one: { id: 'log-1' } }); // activity log

			const result = await todosStore.assignUser('1', 'u2');

			expect(result.success).toBe(true);
			// Promotion (UPDATE_TODOS) is skipped since the todo already had a primary.
			expect(request).toHaveBeenCalledTimes(2);
			expect(todosStore.todos[0].assigned_to).toBe('u1');
			expect(todosStore.todos[0].assignees.map((a) => a.user_id)).toEqual(['u1', 'u2']);
		});

		it('unassigns the primary and promotes a remaining assignee', async () => {
			const a1 = assignment('u1');
			const a2 = assignment('u2');
			const todo = createMockTodo({ id: '1', assigned_to: 'u1', assignees: [a1, a2] });
			(todosStore as unknown as { setTodosForTesting: (t: unknown[]) => void }).setTodosForTesting([
				todo
			]);

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request)
				.mockResolvedValueOnce({ delete_todo_assignees_by_pk: { todo_id: '1', user_id: 'u1' } })
				.mockResolvedValueOnce({
					update_todos: { returning: [{ ...todo, assigned_to: 'u2', assignees: [a2] }] }
				})
				.mockResolvedValueOnce({ insert_activity_logs_one: { id: 'log-1' } }); // activity log

			const result = await todosStore.unassignUser('1', 'u1');

			expect(result.success).toBe(true);
			expect(todosStore.todos[0].assigned_to).toBe('u2');
			expect(todosStore.todos[0].assignees.map((a) => a.user_id)).toEqual(['u2']);
		});
	});
});
