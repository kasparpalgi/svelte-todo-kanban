/** @file src/lib/stores/todos.svelte.ts */
// The open board's cards. Every read and write goes through the data API (`call`, #229);
// the server checks access and writes the activity rows and notifications itself.
import { call, type OpInput, type OpOutput } from '$lib/api/call';
import { browser } from '$app/environment';
import type { BoardTodo, StoreResult, TodosState } from '$lib/types/todo';
import { todoFilteringStore } from './todoFiltering.svelte';
import { listsStore } from './listsBoards.svelte';
import { loggingStore } from './logging.svelte';

type CardSet = OpInput<'updateTodo'>['set'];

/** One page of the board's cards: open ones by position, completed ones newest first. */
function fetchCards(boardId: string | undefined, completed: boolean, limit: number, offset = 0) {
	return call('getTodos', { boardId, completed, limit, offset });
}

const errorMessage = (error: unknown, fallback: string) =>
	error instanceof Error ? error.message : fallback;

function createTodosStore() {
	const state = $state<TodosState>({
		todos: [],
		loading: false,
		error: null,
		initialized: false,
		currentBoardId: null
	});

	// An optimistic card is shown under a `temp-…` id until CREATE_TODO returns. Edits
	// made in that window sent the placeholder to Hasura ("invalid input syntax for
	// type uuid", #209); they now wait here for the real id (null = create failed).
	const pendingCreates = new Map<string, Promise<string | null>>();

	/** The id to send to Hasura: a pending card's real id once known (null = create failed). */
	async function realTodoId(id: string): Promise<string | null> {
		return pendingCreates.get(id) ?? id;
	}

	// Card writes in flight, and how many ever started. A poll that lands while one is
	// pending, or that fetched before one committed, holds the pre-write rows and would
	// put a just-dragged card back where it was (#223) — refreshBoardTodos drops it.
	let writesInFlight = 0;
	let writesStarted = 0;

	function trackWrite<T>(write: Promise<T>): Promise<T> {
		writesInFlight++;
		writesStarted++;
		return write.finally(() => writesInFlight--);
	}

	// Board fingerprint at the last full poll refresh (see refreshBoardTodosIfChanged).
	const FULL_REFRESH_MS = 5 * 60 * 1000;
	let lastFingerprint: { boardId: string; value: string; at: number } | null = null;

	/** Index of a todo by id, looked up fresh: an await may have replaced state.todos. */
	function indexOfTodo(id: string): number {
		return state.todos.findIndex((t) => t.id === id);
	}

	/** Real id and current index of a todo (waits for a pending create); null if gone. */
	async function locateTodo(id: string): Promise<{ id: string; index: number } | null> {
		const realId = await realTodoId(id);
		const index = realId ? indexOfTodo(realId) : -1;
		return realId && index !== -1 ? { id: realId, index } : null;
	}

	/**
	 * Write a todo back by id, never by an index captured before an await: a poll or
	 * another update may have replaced the array, and that slot would now hold a
	 * different card (#209).
	 */
	function replaceTodo(id: string, todo: BoardTodo) {
		const index = indexOfTodo(id);
		if (index !== -1) state.todos[index] = todo;
	}

	/**
	 * Board rows carry no body (#211). Keep the one an opened card already loaded, unless
	 * the card changed since — then it is stale and the next open fetches it again.
	 */
	function keepLoadedContent(incoming: BoardTodo[]): BoardTodo[] {
		const loaded = new Map(
			state.todos.filter((t) => t.content !== undefined).map((t) => [t.id, t])
		);
		if (loaded.size === 0) return incoming;
		return incoming.map((todo) => {
			const old = loaded.get(todo.id);
			return old && old.updated_at === todo.updated_at ? { ...todo, content: old.content } : todo;
		});
	}

	/** Every card of the open board (or, before one is open, of the caller's boards). */
	async function loadTodos(): Promise<BoardTodo[]> {
		if (!browser) return [];
		const boardId = state.currentBoardId ?? undefined;
		return loadInto('Load todos', boardId, async () => {
			const [active, completed] = await Promise.all([
				fetchCards(boardId, false, 1000),
				fetchCards(boardId, true, 200)
			]);
			return [...active, ...completed];
		});
	}

	/** The top 50 open cards, for a fast first render; loadTodosRemaining fetches the rest. */
	async function loadTodosInitial(boardId?: string): Promise<BoardTodo[]> {
		if (!browser) return [];
		return loadInto('Load initial todos', boardId, () => fetchCards(boardId, false, 50));
	}

	async function loadInto(
		what: string,
		boardId: string | undefined,
		load: () => Promise<BoardTodo[]>
	): Promise<BoardTodo[]> {
		state.loading = true;
		state.error = null;
		try {
			state.todos = keepLoadedContent(await load());
			state.initialized = true;
			state.currentBoardId = boardId || null;
			return state.todos;
		} catch (error) {
			state.error = errorMessage(error, 'Error loading todos');
			console.error(`${what} error:`, error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	/** Adds cards not loaded yet (a background page arriving after the first render). */
	function appendNew(todos: BoardTodo[]) {
		const known = new Set(state.todos.map((t) => t.id));
		const fresh = todos.filter((t) => !known.has(t.id));
		if (fresh.length > 0) state.todos = [...state.todos, ...fresh];
	}

	/** The rest of the open cards in pages of 100, then the last 100 completed ones. */
	async function loadTodosRemaining(boardId?: string): Promise<void> {
		if (!browser) return;
		const PAGE = 100;
		try {
			for (let offset = 50; ; offset += PAGE) {
				const page = await fetchCards(boardId, false, PAGE, offset);
				appendNew(page);
				if (page.length < PAGE) break;
				await new Promise((resolve) => setTimeout(resolve, 50)); // let the UI breathe
			}
			appendNew(await fetchCards(boardId, true, PAGE));
		} catch (error) {
			// Non-blocking: the board already shows its first page.
			console.error('Load remaining todos error:', error);
		}
	}

	/**
	 * Fetch a card's full body: the board loads only the light TodoFields (#211). Call it
	 * before anything reads or edits `content`. Returns null when the card is gone.
	 */
	async function loadTodoDetails(todoId: string): Promise<BoardTodo | null> {
		if (!browser) return null;

		try {
			const fullTodo = await call('getTodo', { id: todoId });
			if (!fullTodo) return null;

			if (indexOfTodo(todoId) === -1) state.todos = [...state.todos, fullTodo];
			else replaceTodo(todoId, fullTodo);
			return fullTodo;
		} catch (error) {
			console.error('Load todo details error:', error);
			return null;
		}
	}

	/**
	 * Sync todo changes to GitHub issue
	 * Non-blocking: errors are logged but don't fail the todo update
	 */
	async function syncTodoToGithub(todo: BoardTodo, updates: any, originalTodo: BoardTodo) {
		const boardGithub = listsStore.boardById(todo.list?.board?.id)?.github;
		if (!boardGithub || !todo.github_issue_number) {
			return; // Board not connected or todo not linked to issue
		}

		const githubData = typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
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

		// Priority changed → relabel the issue
		if (updates.priority !== undefined && updates.priority !== originalTodo.priority) {
			githubUpdates.priority = updates.priority;
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
		// A card lives in a list; a board with no list has nowhere to put one.
		if (!listId) return { success: false, message: 'Add a list first' };

		// Import user store to get current user ID
		const { userStore: us } = await import('./user.svelte');

		// Free plan: cap uncompleted cards per board. state.todos is scoped to the
		// selected board, so counting its uncompleted entries gives the board total.
		const { isPaid, FREE_LIMITS } = await import('$lib/config/plan');
		if (!isPaid(us.user)) {
			const uncompletedCount = state.todos.filter((t) => !t.completed_at).length;
			if (uncompletedCount >= FREE_LIMITS.uncompletedCardsPerBoard) {
				const { upgradeStore } = await import('./upgrade.svelte');
				upgradeStore.trigger('cards');
				return { success: false, message: 'Card limit reached', upsell: true };
			}
		}

		const tempId = `temp-${crypto.randomUUID()}`;
		let settleCreate: (id: string | null) => void = () => {};
		pendingCreates.set(tempId, new Promise((resolve) => (settleCreate = resolve)));

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

			// Optimistic insert — show the card immediately before API responds
			const now = new Date().toISOString();
			const listData = listId ? (listsStore.lists.find((l) => l.id === listId) ?? null) : null;
			const optimisticTodo = {
				id: tempId,
				alias: '',
				title: title.trim(),
				content: content?.trim() || null,
				sort_order: sortOrder,
				list_id: listId || null,
				completed_at: null,
				created_at: now,
				updated_at: now,
				assigned_to: us.user?.id || null,
				due_on: null,
				has_time: false,
				priority: priority || null,
				github_issue_number: null,
				github_issue_id: null,
				github_synced_at: null,
				github_url: null,
				min_hours: null,
				max_hours: null,
				actual_hours: null,
				comment_hours: null,
				assignee: us.user
					? {
							id: us.user.id,
							name: us.user.name ?? null,
							username: us.user.username ?? '',
							image: us.user.image ?? null,
							email: us.user.email ?? null
						}
					: null,
				assignees: us.user
					? [
							{
								user_id: us.user.id,
								created_at: now,
								assignee: {
									id: us.user.id,
									name: us.user.name ?? null,
									username: us.user.username ?? '',
									image: us.user.image ?? null,
									email: us.user.email ?? null
								}
							}
						]
					: [],
				labels: [],
				comments_aggregate: { aggregate: { count: 0 } },
				uploads: [],
				subscribers: [],
				list: listData
					? {
							id: listData.id,
							name: listData.name,
							sort_order: listData.sort_order,
							board: listData.board ? { id: listData.board.id } : null
						}
					: null
			} as unknown as BoardTodo;

			const insertIndex = state.todos.findIndex((t) => (t.sort_order || 1000) > sortOrder);
			if (insertIndex === -1) {
				state.todos = [...state.todos, optimisticTodo];
			} else {
				state.todos = [
					...state.todos.slice(0, insertIndex),
					optimisticTodo,
					...state.todos.slice(insertIndex)
				];
			}

			// The server assigns the creator and logs the activity.
			const newTodo = await trackWrite(
				call('createTodo', {
					listId,
					title: title.trim(),
					content: content?.trim() || null,
					sort_order: sortOrder,
					priority: priority ?? null
				})
			);

			if (newTodo) {
				// Replace optimistic placeholder with real todo from API
				const tempIdx = state.todos.findIndex((t) => t.id === tempId);
				if (tempIdx !== -1) {
					state.todos[tempIdx] = newTodo;
				} else {
					state.todos = [...state.todos, newTodo];
				}
				settleCreate(newTodo.id);

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

				// Written last, and only once the issue exists: the issue number is the task
				// file's number, so a draft created first would be numbered wrong.
				// Only write draft file if GitHub integration is enabled AND the user didn't opt out.
				const boardGithub = listsStore.boardById(newTodo.list?.board?.id)?.github;
				if (createGithubIssue && boardGithub && newTodo.id) {
					fetch('/api/github/write-draft-file', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ todoId: newTodo.id })
					}).catch((err) => console.error('Failed to write draft file:', err));
				}

				return {
					success: true,
					message: 'Todo added successfully',
					data: newTodo
				};
			}

			// API returned no todo — rollback optimistic insert
			state.todos = state.todos.filter((t) => t.id !== tempId);
			return { success: false, message: 'Failed to add todo' };
		} catch (error) {
			// Rollback optimistic insert on error
			state.todos = state.todos.filter((t) => t.id !== tempId);
			const message = error instanceof Error ? error.message : 'Error adding todo';
			console.error('Add todo error:', error);
			return { success: false, message };
		} finally {
			settleCreate(null); // no-op once the real id was settled
		}
	}

	async function updateTodo(
		id: string,
		updates: Partial<
			Pick<
				BoardTodo,
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
				| 'agent_model'
				| 'agent_effort'
				| 'agent_machine'
				| 'agent_plan_first'
			> & {
				list_id?: string | null;
				assigned_to?: string | null;
			}
		>
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Only a pending card awaits: an await on every call would defer the optimistic update.
		if (pendingCreates.has(id)) {
			const realId = await realTodoId(id);
			if (!realId) return { success: false, message: 'Todo not found' };
			id = realId;
		}

		const todoIndex = indexOfTodo(id);
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

			state.todos[todoIndex] = optimisticUpdate as BoardTodo;
		}

		try {
			// The server works out and writes the activity row (#229).
			const updatedTodo = await trackWrite(
				call('updateTodo', { id, set: updates as CardSet })
			);

			if (updatedTodo) {
				replaceTodo(id, updatedTodo);

				// Card moved: into the board's agent list the server renames the draft
				// NNN-slug.md → NNN-slug-TODO.md; out of it, the -TODO file back to its draft.
				if (updates.list_id !== undefined && originalTodo.list?.id !== updates.list_id) {
					fetch('/api/github/write-task-file', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ todoId: id })
					}).catch((err) => console.error('Failed to write task file:', err));
				}

				// Content changed on a queued task: rewrite its -TODO file. A draft is left alone —
				// one commit per save buried main — and publishing it takes the card's text.
				if (
					updates.content !== undefined &&
					originalTodo.content !== updates.content &&
					/-TODO\.md$/i.test((updatedTodo as any).task_file_path ?? '')
				) {
					fetch('/api/github/update-task-file', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ todoId: id })
					}).catch((err) => console.error('Failed to update task file:', err));
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
				replaceTodo(id, originalTodo);
				return { success: false, message: 'Failed to update todo' };
			}
		} catch (error) {
			replaceTodo(id, originalTodo);
			const message = error instanceof Error ? error.message : 'Error updating todo';
			console.error('Update todo error:', error);
			return { success: false, message };
		}
	}

	/** Runs a card op that hands back the updated card, and shows that card. */
	async function cardOp(
		run: () => Promise<OpOutput<'getTodo'>>,
		ok: string,
		failed: string
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		try {
			const todo = await trackWrite(run());
			if (todo) putTodo(todo);
			return { success: true, message: ok, data: todo };
		} catch (error) {
			console.error(`${failed}:`, error);
			return { success: false, message: errorMessage(error, failed) };
		}
	}

	/** Show a card the server just returned, if this board has it loaded. */
	function putTodo(todo: BoardTodo) {
		replaceTodo(todo.id, todo);
	}

	const createUpload = (todoId: string, url: string) =>
		cardOp(() => call('createUpload', { todoId, url }), 'Upload created', 'Failed to create upload');

	const deleteUpload = (uploadId: string) =>
		cardOp(() => call('deleteUpload', { id: uploadId }), 'Upload deleted', 'Failed to delete upload');

	/**
	 * Silently re-fetch all todos for a board without touching `loading`,
	 * so polling doesn't flash the loading spinner. Used to pick up changes
	 * made by other users/tabs without requiring a manual page refresh.
	 */
	async function refreshBoardTodos(boardId: string): Promise<boolean> {
		if (!browser) return false;

		const startedBefore = writesStarted;
		try {
			const [active, completed] = await Promise.all([
				fetchCards(boardId, false, 1000),
				fetchCards(boardId, true, 200)
			]);

			// Board may have changed while this request was in flight
			if (state.currentBoardId !== boardId) return false;
			// Not recorded as refreshed, so the next poll tries again (#223).
			if (writesInFlight > 0 || writesStarted !== startedBefore) return false;

			state.todos = keepLoadedContent([...active, ...completed]);
			return true;
		} catch (error) {
			console.error('Refresh board todos error:', error);
			return false;
		}
	}

	/**
	 * Poll entry point. `value` is the board's fingerprint from the `poll` op (a short
	 * hash of its cards and lists); the full refreshBoardTodos() runs only when it
	 * changed — or when the last full refresh is older than FULL_REFRESH_MS, which
	 * picks up what the fingerprint cannot see (a comment edited in place). Returns
	 * true when it refreshed.
	 */
	async function refreshBoardTodosIfChanged(boardId: string, value: string): Promise<boolean> {
		if (!browser) return false;

		const last = lastFingerprint;
		const unchanged =
			last?.boardId === boardId && last.value === value && Date.now() - last.at < FULL_REFRESH_MS;
		if (unchanged) return false;

		const refreshed = await refreshBoardTodos(boardId);
		// Taken before the full fetch: a change in between only costs one more refresh.
		if (refreshed) lastFingerprint = { boardId, value, at: Date.now() };
		return refreshed;
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

		const realId = await realTodoId(id);
		if (!realId) return { success: false, message: 'Todo not found' };
		id = realId;

		// Get the todo to check if it has a GitHub issue
		const todo = state.todos.find((t) => t.id === id);
		const githubIssueNumber = (todo as any)?.github_issue_number;
		const githubIssueId = (todo as any)?.github_issue_id;
		const boardGithub = listsStore.boardById(todo?.list?.board?.id)?.github;

		try {
			const { deleted } = await trackWrite(call('deleteTodo', { id }));

			if (deleted) {
				// Close GitHub issue if this todo was linked to one
				if (githubIssueNumber && githubIssueId && boardGithub) {
					try {
						const githubData =
							typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
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

				// The card's draft or -TODO file goes too, or the runner still sees it (#79).
				const taskFilePath = (todo as any)?.task_file_path;
				if (taskFilePath && boardGithub) {
					const gh = typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
					fetch('/api/github/delete-task-file', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							path: taskFilePath,
							owner: (gh as any).owner,
							repo: (gh as any).repo,
							issueNumber: githubIssueNumber
						})
					}).catch((err) => console.error('Failed to delete task file:', err));
				}

				// Optimistically remove from local state
				state.todos = state.todos.filter((t) => t.id !== id);
				return { success: true, message: 'Todo deleted successfully' };
			}

			loggingStore.warn('TodosStore', 'Delete returned no row', { todoId: id });
			return { success: false, message: 'Failed to delete todo' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error deleting todo';
			console.error('Delete todo error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Assign a user to a card (multi-assignee). The server keeps `assigned_to` (the primary
	 * assignee) in sync, logs it and notifies the person assigned.
	 */
	async function assignUser(todoId: string, userId: string): Promise<StoreResult> {
		const target = await locateTodo(todoId);
		if (!target) return { success: false, message: 'Todo not found' };
		if ((state.todos[target.index].assignees || []).some((a) => a.user_id === userId)) {
			return { success: true, message: 'Already assigned' };
		}
		return cardOp(
			() => call('assignUser', { todoId: target.id, userId }),
			'User assigned',
			'Failed to assign user'
		);
	}

	/** Unassign a user; when it was the primary assignee, the server promotes the next one. */
	async function unassignUser(todoId: string, userId: string): Promise<StoreResult> {
		const target = await locateTodo(todoId);
		if (!target) return { success: false, message: 'Todo not found' };
		return cardOp(
			() => call('unassignUser', { todoId: target.id, userId }),
			'User unassigned',
			'Failed to unassign user'
		);
	}

	const subscribeToTodo = (todoId: string, userId: string) =>
		cardOp(() => call('subscribeToTodo', { todoId, userId }), 'Subscribed', 'Failed to subscribe');

	const unsubscribeFromTodo = (todoId: string, userId: string) =>
		cardOp(
			() => call('unsubscribeFromTodo', { todoId, userId }),
			'Unsubscribed',
			'Failed to unsubscribe'
		);

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

		const groups = new Map<string, BoardTodo[]>();
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
		get currentBoardId() {
			return state.currentBoardId;
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
		createUpload,
		deleteUpload,
		refreshBoardTodos,
		refreshBoardTodosIfChanged,
		assignUser,
		unassignUser,
		subscribeToTodo,
		unsubscribeFromTodo,
		putTodo,
		clearError: () => {
			state.error = null;
		},
		reset: () => {
			lastFingerprint = null;
			state.todos = [];
			state.loading = false;
			state.error = null;
			state.initialized = false;
			state.currentBoardId = null;
		},

		...(import.meta.env?.MODE === 'test' || process.env.NODE_ENV === 'test'
			? {
					setTodosForTesting: (todos: BoardTodo[]) => {
						state.todos = todos;
					}
				}
			: {})
	};
}

export const todosStore = createTodosStore();
