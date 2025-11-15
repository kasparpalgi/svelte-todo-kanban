/** @file src/lib/stores/todos.svelte.ts */
import {
	GET_TODOS,
	GET_TODOS_MINIMAL,
	GET_TODO_DETAILS,
	CREATE_TODO,
	UPDATE_TODOS,
	DELETE_TODOS,
	CREATE_UPLOAD,
	DELETE_UPLOAD,
	CREATE_NOTIFICATION,
	CREATE_ACTIVITY_LOG
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

	/**
	 * Load initial batch of todos (top 15 per list) with minimal data (no comments/uploads)
	 * This provides fast initial render for the board view
	 */
	async function loadTodosInitial(boardId?: string): Promise<TodoFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const where: any = { completed_at: { _is_null: true } };
			if (boardId) {
				where.list = { board_id: { _eq: boardId } };
			}

			const data: any = await request(GET_TODOS_MINIMAL, {
				where,
				order_by: [
					{ sort_order: Order_By.Asc },
					{ due_on: Order_By.Desc },
					{ updated_at: Order_By.Desc }
				],
				limit: 50, // Load top 50 active todos initially
				offset: 0
			});

			// Merge with existing todos (in case some were already loaded)
			const existingIds = new Set(state.todos.map(t => t.id));
			const newTodos = (data.todos || []).filter((t: any) => !existingIds.has(t.id));

			state.todos = [...state.todos, ...newTodos];
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
			console.error('Load initial todos error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Load remaining todos in the background after initial render
	 * Loads in chunks to avoid blocking the UI
	 */
	async function loadTodosRemaining(boardId?: string): Promise<void> {
		if (!browser) return;

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const where: any = { completed_at: { _is_null: true } };
			if (boardId) {
				where.list = { board_id: { _eq: boardId } };
			}

			// Load remaining todos in chunks of 100
			let offset = 50; // Skip the first 50 we already loaded
			let hasMore = true;

			while (hasMore) {
				const data: any = await request(GET_TODOS_MINIMAL, {
					where,
					order_by: [
						{ sort_order: Order_By.Asc },
						{ due_on: Order_By.Desc },
						{ updated_at: Order_By.Desc }
					],
					limit: 100,
					offset
				});

				const todos = data.todos || [];

				if (todos.length === 0) {
					hasMore = false;
					break;
				}

				// Merge with existing todos
				const existingIds = new Set(state.todos.map(t => t.id));
				const newTodos = todos.filter((t: any) => !existingIds.has(t.id));

				if (newTodos.length > 0) {
					state.todos = [...state.todos, ...newTodos];
				}

				offset += 100;

				// If we got less than 100, we've reached the end
				if (todos.length < 100) {
					hasMore = false;
				}

				// Small delay to avoid blocking the UI
				await new Promise(resolve => setTimeout(resolve, 50));
			}

			// Now load completed todos
			const completedWhere: any = { completed_at: { _is_null: false } };
			if (boardId) {
				completedWhere.list = { board_id: { _eq: boardId } };
			}

			const completedData: any = await request(GET_TODOS_MINIMAL, {
				where: completedWhere,
				order_by: [{ completed_at: Order_By.Desc }],
				limit: 100,
				offset: 0
			});

			const completedTodos = completedData.todos || [];
			const existingIds = new Set(state.todos.map(t => t.id));
			const newCompletedTodos = completedTodos.filter((t: any) => !existingIds.has(t.id));

			if (newCompletedTodos.length > 0) {
				state.todos = [...state.todos, ...newCompletedTodos];
			}

		} catch (error) {
			// Non-blocking: log error but don't fail
			console.error('Load remaining todos error:', error);
		}
	}

	/**
	 * Load full details for a specific todo (including comments and uploads)
	 * Used when opening the card modal
	 */
	async function loadTodoDetails(todoId: string): Promise<TodoFieldsFragment | null> {
		if (!browser) return null;

		try {
			const data: any = await request(GET_TODO_DETAILS, {
				id: todoId
			});

			const fullTodo = data.todos_by_pk;

			if (fullTodo) {
				// Update the todo in state with full details
				const index = state.todos.findIndex(t => t.id === todoId);
				if (index !== -1) {
					state.todos[index] = fullTodo;
				} else {
					// Todo not in state yet, add it
					state.todos = [...state.todos, fullTodo];
				}
				return fullTodo;
			}

			return null;
		} catch (error) {
			console.error('Load todo details error:', error);
			return null;
		}
	}

	/**
	 * Sync todo changes to GitHub issue
	 * Non-blocking: errors are logged but don't fail the todo update
	 */
	async function syncTodoToGithub(
		todo: TodoFieldsFragment,
		updates: any,
		originalTodo: TodoFieldsFragment
	) {
		if (!todo.list || !(todo.list.board as any)?.github || !(todo as any).github_issue_number) {
			return; // Board not connected or todo not linked to issue
		}

		const githubData = 
			typeof (todo.list.board as any).github === 'string'
				? JSON.parse((todo.list.board as any).github)
				: (todo.list.board as any).github;
		const { owner, repo } = githubData as { owner: string; repo: string };

		// Determine what changed and needs to be synced
		const githubUpdates: any = {};

		// Title changed
		if (updates.title !== undefined && updates.title !== originalTodo.title) {
			githubUpdates.title = updates.title;
		}

		// Content changed
		if (updates.content !== undefined && updates.content !== originalTodo.content) {
			githubUpdates.body = updates.content;
		}

		// Completion status changed
		if (updates.completed_at !== undefined) {
			if (updates.completed_at && !originalTodo.completed_at) {
				// Todo completed → close issue
				githubUpdates.state = 'closed';
			} else if (!updates.completed_at && originalTodo.completed_at) {
				// Todo reopened → reopen issue
				githubUpdates.state = 'open';
			}
		}

		// Only sync if there are changes
		if (Object.keys(githubUpdates).length === 0) {
			return;
		}

		await fetch('/api/github/update-issue', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				todoId: todo.id,
				githubIssueNumber: (todo as any).github_issue_number,
				owner,
				repo,
				...githubUpdates
			})
		});
	}

	async function addTodo(
		title: string,
		content?: string,
		listId?: string,
		addToTop: boolean = true,
		createGithubIssue: boolean = false,
		priority?: 'low' | 'medium' | 'high' | null
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!title.trim()) return { success: false, message: 'Title is required' };

		// Import user store to get current user ID
		const { userStore: us } = await import('./user.svelte');

		try {
			let sortOrder: number;

			const relevantTodos = state.todos.filter((t) => {
				if (t.completed_at) return false;
				if (listId) {
					return t.list?.id === listId;
				} else {
					return !t.list?.id;
				}
			});

			if (addToTop) {
				if (relevantTodos.length > 0) {
					const minSortOrder = Math.min(...relevantTodos.map((t) => t.sort_order || 1000));
					sortOrder = minSortOrder - 1000;
				} else {
					sortOrder = 1000;
				}
			} else {
				if (relevantTodos.length > 0) {
					const maxSortOrder = Math.max(...relevantTodos.map((t) => t.sort_order || 1000));
					sortOrder = maxSortOrder + 1000;
				} else {
					sortOrder = 1000;
				}
			}

			const data: CreateTodoMutation = await request(CREATE_TODO, {
				objects: [
					{
						title: title.trim(),
						content: content?.trim() || null,
						sort_order: sortOrder,
						...(listId && { list_id: listId }),
						assigned_to: us.user?.id || null
					}
				]
			});

			const newTodo = data.insert_todos?.returning?.[0];
			if (newTodo) {
				const todoIndex = state.todos.findIndex((t) => (t.sort_order || 1000) > sortOrder);

				if (todoIndex === -1) {
					state.todos = [...state.todos, newTodo];
				} else {
					state.todos = [
						...state.todos.slice(0, todoIndex),
						newTodo,
						...state.todos.slice(todoIndex)
					];
				}

				// Log activity: todo created
				try {
					await request(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: newTodo.id,
							action_type: 'created'
						}
					});
				} catch (error) {
					// Non-blocking: log error but don't fail todo creation
					console.error('[TodosStore.addTodo] Failed to log activity:', error);
				}

				// Create GitHub issue if requested
				if (createGithubIssue && newTodo.id) {
					try {
						const githubResponse = await fetch('/api/github/create-issue', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								todoId: newTodo.id,
								title: title.trim(),
								body: content?.trim() || null,
								priority
							})
						});

						if (githubResponse.ok) {
							const githubData = await githubResponse.json();
							// Update the local todo with GitHub metadata
							const todoIdx = state.todos.findIndex((t) => t.id === newTodo.id);
							if (todoIdx !== -1) {
								state.todos[todoIdx] = {
									...state.todos[todoIdx],
									github_issue_number: githubData.issueNumber,
									github_issue_id: githubData.issueId,
									github_url: githubData.issueUrl,
									github_synced_at: new Date().toISOString()
								} as any;
							}
						} else {
							// Non-blocking: log error but don't fail todo creation
							console.error('Failed to create GitHub issue:', await githubResponse.text());
						}
					} catch (githubError) {
						// Non-blocking: log error but don't fail todo creation
						console.error('Error creating GitHub issue:', githubError);
					}
				}

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
			Pick<
				TodoFieldsFragment,
				| 'title'
				| 'content'
				| 'completed_at'
				| 'due_on'
				| 'has_time'
				| 'sort_order'
				| 'priority'
				| 'min_hours'
				| 'max_hours'
				| 'actual_hours'
				| 'comment_hours'
			> & {
				list_id?: string | null;
				assigned_to?: string | null;
			}
		>
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const todoIndex = state.todos.findIndex((t) => t.id === id);
		if (todoIndex === -1) return { success: false, message: 'Todo not found' };

		const originalTodo = { ...state.todos[todoIndex] };

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
					const targetListTodo = state.todos.find((t) => t.list?.id === updates.list_id);
					if (targetListTodo?.list) {
						optimisticUpdate.list = { ...targetListTodo.list };
					} else {
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

				// Log activity based on what changed
				try {
					let actionType: string | null = null;
					let fieldName: string | undefined;
					let oldValue: string | undefined;
					let newValue: string | undefined;

					// Determine action type based on what actually changed
					if (updates.completed_at !== undefined) {
						// Completion status changed
						actionType = updates.completed_at ? 'completed' : 'uncompleted';
					} else if (updates.priority !== undefined && originalTodo.priority !== updates.priority) {
						// Priority changed (and values are different)
						actionType = 'priority_changed';
						fieldName = 'priority';
						oldValue = originalTodo.priority?.toString() || '';
						newValue = updates.priority?.toString() || '';
					} else if (updates.due_on !== undefined && originalTodo.due_on !== updates.due_on) {
						// Due date changed (and values are different)
						actionType = 'due_date_changed';
						fieldName = 'due_on';
						oldValue = originalTodo.due_on || '';
						newValue = updates.due_on || '';
					} else if (updates.assigned_to !== undefined && originalTodo.assigned_to !== updates.assigned_to) {
						// Assignee changed (and values are different)
						actionType = updates.assigned_to ? 'assigned' : 'unassigned';
					} else if (updates.list_id !== undefined && originalTodo.list?.id !== updates.list_id) {
						// List changed (card moved)
						actionType = 'updated';
					} else if (updates.title !== undefined || updates.content !== undefined) {
						// Title or content changed
						actionType = 'updated';
					}

					// Only log if there's an actual change
					if (actionType) {
						await request(CREATE_ACTIVITY_LOG, {
							log: {
								todo_id: id,
								action_type: actionType,
								field_name: fieldName,
								old_value: oldValue,
								new_value: newValue
							}
						});
					}
				} catch (error) {
					// Non-blocking: log error but don't fail todo update
					console.error('[TodosStore.updateTodo] Failed to log activity:', error);
				}

				// Sync to GitHub if todo is linked to a GitHub issue
				if ((updatedTodo as any).github_issue_number && (updatedTodo as any).github_issue_id) {
					syncTodoToGithub(updatedTodo, updates, originalTodo).catch((err) => {
						// Non-blocking: log error but don't fail todo update
						console.error('Failed to sync todo to GitHub:', err);
					});
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
				// Log activity: image added
				try {
					await request(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todoId,
							action_type: 'image_added'
						}
					});
				} catch (error) {
					// Non-blocking: log error but don't fail upload
					console.error('[TodosStore.createUpload] Failed to log activity:', error);
				}

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
				// Log activity: image removed
				try {
					await request(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todoId,
							action_type: 'image_removed'
						}
					});
				} catch (error) {
					// Non-blocking: log error but don't fail deletion
					console.error('[TodosStore.deleteUpload] Failed to log activity:', error);
				}

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

		// Get the todo to check if it has a GitHub issue
		const todo = state.todos.find((t) => t.id === id);
		const githubIssueNumber = (todo as any)?.github_issue_number;
		const githubIssueId = (todo as any)?.github_issue_id;
		const boardGithub = todo?.list?.board?.github;

		// Log activity BEFORE deletion (since todo will be removed)
		if (todo) {
			try {
				await request(CREATE_ACTIVITY_LOG, {
					log: {
						todo_id: id,
						action_type: 'deleted'
					}
				});
			} catch (error) {
				// Non-blocking: log error but don't fail deletion
				console.error('[TodosStore.deleteTodo] Failed to log activity:', error);
			}
		}

		try {
			const data: DeleteTodosMutation = await request(DELETE_TODOS, {
				where: { id: { _eq: id } }
			});

			if (data.delete_todos?.affected_rows && data.delete_todos.affected_rows > 0) {
				// Close GitHub issue if this todo was linked to one
				if (githubIssueNumber && githubIssueId && boardGithub) {
					try {
						const githubData = typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
						const { owner, repo } = githubData as { owner: string; repo: string };

						await fetch('/api/github/delete-issue', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								todoId: id,
								githubIssueNumber,
								owner,
								repo,
								closeIssue: true
							})
						});
						// Non-blocking: don't wait for response, don't fail if GitHub sync fails
					} catch (githubError) {
						// Non-blocking: log error but don't fail todo deletion
						console.error('Failed to close GitHub issue on deletion:', githubError);
					}
				}

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
		loadTodosInitial,
		loadTodosRemaining,
		loadTodoDetails,
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
		},

		...(import.meta.env?.MODE === 'test' || process.env.NODE_ENV === 'test'
			? {
					setTodosForTesting: (todos: TodoFieldsFragment[]) => {
						state.todos = todos;
					}
				}
			: {})
	};
}

export const todosStore = createTodosStore();
