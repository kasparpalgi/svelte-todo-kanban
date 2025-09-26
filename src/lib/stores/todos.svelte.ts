/** @file src/lib/stores/todos.svelte.ts */
import {
	GET_TODOS,
	CREATE_TODO,
	UPDATE_TODOS,
	DELETE_TODOS,
	CREATE_UPLOAD,
	DELETE_UPLOAD
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	GetTodosQuery,
	CreateTodoMutation,
	UpdateTodosMutation,
	DeleteTodosMutation,
	CreateUploadMutation,
	DeleteUploadMutation,
	TodoFieldsFragment
} from '$lib/graphql/generated/graphql';
import type { StoreResult, TodosState } from '$lib/types/todo';
import { todoFilteringStore } from './todoFiltering.svelte';
import { listsStore } from './listsBoards.svelte';

function createTodosStore() {
	const state = $state<TodosState>({
		todos: [],
		loading: false,
		error: null,
		initialized: false
	});

	async function loadTodos(): Promise<TodoFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const data: GetTodosQuery = await request(GET_TODOS, {
				where: {},
				order_by: [
					{ sort_order: Order_By.Asc },
					{ due_on: Order_By.Desc },
					{ updated_at: Order_By.Desc }
				],
				limit: 1000,
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

	async function addTodo(title: string, content?: string, listId?: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!title.trim()) return { success: false, message: 'Title is required' };

		try {
			const data: CreateTodoMutation = await request(CREATE_TODO, {
				objects: [
					{
						title: title.trim(),
						content: content?.trim() || null,
						...(listId && { list_id: listId })
					}
				]
			});

			const newTodo = data.insert_todos?.returning?.[0];
			if (newTodo) {
				// Optimistically add to local state
				state.todos = [newTodo, ...state.todos];
				return {
					success: true,
					message: 'Todo added successfully',
					data: newTodo
				};
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
		updates: Partial<
			Pick<TodoFieldsFragment, 'title' | 'content' | 'completed_at' | 'due_on' | 'sort_order'> & {
				list_id?: string | null;
			}
		>
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Store original (potential rollback)
		const todoIndex = state.todos.findIndex((t) => t.id === id);
		const originalTodo = todoIndex !== -1 ? { ...state.todos[todoIndex] } : null;

		// Optimistic update
		if (todoIndex !== -1) {
			const currentTodo = state.todos[todoIndex];

			const optimisticUpdate: any = {
				...currentTodo,
				...updates
			};

			if (updates.list_id !== undefined) {
				if (updates.list_id === null) {
					optimisticUpdate.list = null;
				} else {
					// Find target list info from existing todos
					const targetListTodo = state.todos.find((t) => t.list?.id === updates.list_id);
					if (targetListTodo?.list) {
						optimisticUpdate.list = { ...targetListTodo.list };
					} else {
						// Fallback - try to get from listsStore
						const targetList = listsStore.lists.find((l) => l.id === updates.list_id);
						if (targetList) {
							optimisticUpdate.list = {
								id: targetList.id,
								name: targetList.name,
								sort_order: targetList.sort_order,
								board: targetList.board,
								__typename: 'lists' as const
							};
						} else {
							// Create unknown list
							optimisticUpdate.list = {
								id: updates.list_id,
								name: 'Unknown List',
								sort_order: 999,
								__typename: 'lists' as const
							};
						}
					}
				}
			}

			state.todos[todoIndex] = optimisticUpdate as TodoFieldsFragment;
		}

		try {
			const data: UpdateTodosMutation = await request(UPDATE_TODOS, {
				where: { id: { _eq: id } },
				_set: updates
			});

			const updatedTodo = data.update_todos?.returning?.[0];
			if (updatedTodo) {
				if (todoIndex !== -1) {
					state.todos[todoIndex] = updatedTodo;
				}
				return {
					success: true,
					message: 'Todo updated successfully',
					data: updatedTodo
				};
			} else {
				if (todoIndex !== -1 && originalTodo) {
					state.todos[todoIndex] = originalTodo;
				}
				return { success: false, message: 'Failed to update todo' };
			}
		} catch (error) {
			if (todoIndex !== -1 && originalTodo) {
				state.todos[todoIndex] = originalTodo;
			}
			const message = error instanceof Error ? error.message : 'Error updating todo';
			console.error('Update todo error:', error);
			return { success: false, message };
		}
	}

	async function createUpload(todoId: string, url: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: CreateUploadMutation = await request(CREATE_UPLOAD, {
				objects: [
					{
						todo_id: todoId,
						url: url
					}
				]
			});

			if (data.insert_uploads?.returning?.[0]) {
				// Refresh the todo to get updated uploads
				await refreshTodo(todoId);
				return { success: true, message: 'Upload created successfully' };
			}

			return { success: false, message: 'Failed to create upload record' };
		} catch (error) {
			console.error('Create upload error:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to create upload'
			};
		}
	}

	async function deleteUpload(uploadId: string, todoId: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: DeleteUploadMutation = await request(DELETE_UPLOAD, {
				where: { id: { _eq: uploadId } }
			});

			if (data.delete_uploads?.affected_rows && data.delete_uploads.affected_rows > 0) {
				// Refresh the todo to get updated uploads
				await refreshTodo(todoId);
				return { success: true, message: 'Upload deleted successfully' };
			}

			return { success: false, message: 'Failed to delete upload' };
		} catch (error) {
			console.error('Delete upload error:', error);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Failed to delete upload'
			};
		}
	}

	async function refreshTodo(todoId: string): Promise<void> {
		try {
			const data: GetTodosQuery = await request(GET_TODOS, {
				where: { id: { _eq: todoId } }
			});

			if (data.todos?.[0]) {
				const updatedTodo = data.todos[0];
				// Update the todo in the store's todos array
				const index = state.todos.findIndex((t) => t.id === todoId);
				if (index !== -1) {
					state.todos[index] = updatedTodo;
				}
			}
		} catch (error) {
			console.error('Refresh todo error:', error);
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
			const data: DeleteTodosMutation = await request(DELETE_TODOS, {
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

	async function bulkUpdateTodos(
		where: { [key: string]: any },
		updates: { [key: string]: any }
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: UpdateTodosMutation = await request(UPDATE_TODOS, {
				where,
				_set: updates
			});

			if (data.update_todos?.affected_rows && data.update_todos.affected_rows > 0) {
				await loadTodos();
				return {
					success: true,
					message: `Updated ${data.update_todos.affected_rows} todos`
				};
			}

			return { success: false, message: 'No todos were updated' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error updating todos';
			console.error('Bulk update todos error:', error);
			return { success: false, message };
		}
	}

	const activeTodos = $derived(() => {
		const currentFilters = { ...todoFilteringStore.filters, completed: false };
		const tempState = {
			filters: currentFilters,
			sorting: todoFilteringStore.sorting,
			pagination: todoFilteringStore.pagination
		};

		return state.todos
			.filter((t) => !t.completed_at)
			.filter((t) => {
				// Board filtering
				if (currentFilters.boardId !== undefined) {
					if (currentFilters.boardId === null) {
						if (t.list?.board?.id) return false;
					} else {
						if (t.list?.board?.id !== currentFilters.boardId) return false;
					}
				}
				return true;
			})
			.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
	});

	const completedTodos = $derived(() => {
		const currentFilters = { ...todoFilteringStore.filters, completed: true };

		return state.todos
			.filter((t) => !!t.completed_at)
			.filter((t) => {
				// Board filtering
				if (currentFilters.boardId !== undefined) {
					if (currentFilters.boardId === null) {
						if (t.list?.board?.id) return false;
					} else {
						if (t.list?.board?.id !== currentFilters.boardId) return false;
					}
				}
				return true;
			})
			.sort(
				(a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
			);
	});

	const todosByList = $derived(() => {
		const currentFilters = { ...todoFilteringStore.filters };
		const activeTodosFiltered = state.todos
			.filter((t) => !t.completed_at)
			.filter((t) => {
				// Board filtering
				if (currentFilters.boardId !== undefined) {
					if (currentFilters.boardId === null) {
						if (t.list?.board?.id) return false;
					} else {
						if (t.list?.board?.id !== currentFilters.boardId) return false;
					}
				}
				return true;
			});

		const groups = new Map<string, TodoFieldsFragment[]>();
		for (const todo of activeTodosFiltered) {
			const listId = todo.list?.id || 'inbox';
			if (!groups.has(listId)) {
				groups.set(listId, []);
			}
			groups.get(listId)!.push(todo);
		}
		return groups;
	});

	return {
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
		get todosByList() {
			return todosByList;
		},

		loadTodos,
		addTodo,
		updateTodo,
		toggleTodo,
		deleteTodo,
		bulkUpdateTodos,
		createUpload,
		deleteUpload,
		refreshTodo,
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
