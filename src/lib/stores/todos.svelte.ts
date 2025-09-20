/** @file src/lib/stores/todos.svelte.ts */
import { GET_TODOS, CREATE_TODO, UPDATE_TODOS, DELETE_TODOS } from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type { StoreResult, Todo, TodosState } from '$lib/types/todo';

function createTodosStore() {
	const state = $state<TodosState>({
		todos: [],
		loading: false,
		error: null,
		initialized: false
	});

	async function loadTodos(): Promise<Todo[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const data = await request(GET_TODOS, {
				where: {},
				order_by: [{ due_on: 'desc' }, { updated_at: 'desc' }],
				limit: 100,
				offset: 0
			});

			state.todos = data.todos || [];
			state.initialized = true;
			return state.todos;
		} catch (error) {
			let message = 'Error loading todos';

			if (error instanceof Error) {
				if (error.message.includes('Not authenticated')) {
					message = 'Please sign in to view your todos';
				} else if (error.message.includes('access-denied')) {
					message = 'Access denied - please check your permissions';
				} else if (error.message.includes('Failed to get JWT token')) {
					message = 'Authentication failed - please try refreshing the page';
				} else {
					message = error.message;
				}
			}

			state.error = message;
			console.error('Load todos error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function addTodo(title: string, content?: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!title.trim()) return { success: false, message: 'Title is required' };

		try {
			const data = await request(CREATE_TODO, {
				objects: [
					{
						title: title.trim(),
						content: content?.trim() || null
					}
				]
			});

			if (data.insert_todos?.returning?.length > 0) {
				await loadTodos(); // Reload to get fresh data
				return { success: true, message: 'Todo added successfully' };
			}

			return { success: false, message: 'Failed to add todo' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error adding todo';
			console.error('Add todo error:', error);
			return { success: false, message };
		}
	}

	async function updateTodo(
		id: string,
		updates: Partial<Pick<Todo, 'title' | 'content' | 'completed_at' | 'due_on'>>
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data = await request(UPDATE_TODOS, {
				where: { id: { _eq: id } },
				_set: updates
			});

			if (data.update_todos?.affected_rows && data.update_todos.affected_rows > 0) {
				// Optimistically update local state
				const todoIndex = state.todos.findIndex((t) => t.id === id);
				if (todoIndex !== -1) {
					state.todos[todoIndex] = {
						...state.todos[todoIndex],
						...updates,
						updated_at: new Date().toISOString()
					};
				}
				return { success: true, message: 'Todo updated successfully' };
			}

			return { success: false, message: 'Failed to update todo' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error updating todo';
			console.error('Update todo error:', error);
			return { success: false, message };
		}
	}

	async function toggleTodo(id: string): Promise<StoreResult> {
		const todo = state.todos.find((t) => t.id === id);
		if (!todo) return { success: false, message: 'Todo not found' };

		const isCompleted = !!todo.completed_at;
		return await updateTodo(id, {
			completed_at: isCompleted ? null : new Date().toISOString()
		});
	}

	async function deleteTodo(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data = await request(DELETE_TODOS, {
				where: { id: { _eq: id } }
			});

			if (data.delete_todos?.affected_rows && data.delete_todos.affected_rows > 0) {
				// Optimistically remove from local state
				state.todos = state.todos.filter((t) => t.id !== id);
				return { success: true, message: 'Todo deleted successfully' };
			}

			return { success: false, message: 'Failed to delete todo' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error deleting todo';
			console.error('Delete todo error:', error);
			return { success: false, message };
		}
	}

	// Computed properties using $derived
	const activeTodos = $derived(
		state.todos
			.filter((t) => !t.completed_at)
			.sort((a, b) => {
				// Sort by due date first, then by creation date
				if (a.due_on && b.due_on) {
					return new Date(a.due_on).getTime() - new Date(b.due_on).getTime();
				}
				if (a.due_on) return -1;
				if (b.due_on) return 1;
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			})
	);

	const completedTodos = $derived(
		state.todos
			.filter((t) => !!t.completed_at)
			.sort(
				(a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
			)
	);

	return {
		// State getters
		get todos() {
			return state.todos;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get initialized() {
			return state.initialized;
		},
		get activeTodos() {
			return activeTodos;
		},
		get completedTodos() {
			return completedTodos;
		},

		// Actions
		loadTodos,
		addTodo,
		updateTodo,
		toggleTodo,
		deleteTodo,
		clearError: () => {
			state.error = null;
		},
		reset: () => {
			state.todos = [];
			state.loading = false;
			state.error = null;
			state.initialized = false;
		}
	};
}

export const todosStore = createTodosStore();
