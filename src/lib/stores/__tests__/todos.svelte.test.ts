/** @file src/lib/stores/__tests__/todos.svelte.test.ts */
import { todosStore } from '../todos.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$lib/graphql/client');

const createMockTodo = (overrides: Partial<TodoFieldsFragment> = {}): TodoFieldsFragment => ({
	id: 'test-id',
	title: 'Test Todo',
	content: 'Test content',
	completed_at: null,
	due_on: null,
	priority: 'medium',
	sort_order: 1,
	created_at: '2025-01-01T00:00:00Z',
	updated_at: '2025-01-01T00:00:00Z',
	list: null,
	uploads: [],
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

	describe('deleteTodo', () => {
		it('should delete a todo and remove it from the store', async () => {
			const todoToDelete = createMockTodo({ id: '1' });

			const { request } = await import('$lib/graphql/client');
			vi.mocked(request).mockResolvedValueOnce({
				insert_todos: { returning: [todoToDelete] }
			});
			await todosStore.addTodo('Test Todo');

			vi.mocked(request).mockResolvedValueOnce({
				delete_todos: { affected_rows: 1 }
			});

			const result = await todosStore.deleteTodo('1');

			expect(result.success).toBe(true);
			expect(todosStore.todos).toHaveLength(0);
		});
	});

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
});
