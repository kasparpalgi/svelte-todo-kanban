/** @file src/lib/stores/listsBoards.svelte.ts */
import { call } from '$lib/api/call';
import { browser } from '$app/environment';
import type { ListFieldsFragment, BoardFieldsFragment } from '$lib/graphql/generated/graphql';
import type { ListBoardStoreResult } from '$lib/types/listBoard';
import { displayMessage } from './errorSuccess.svelte';
import { userStore } from './user.svelte';

export function canEditBoard(
	board: BoardFieldsFragment | null,
	userId: string | undefined
): boolean {
	if (!board || !userId) return false;
	if (board.user?.id === userId) return true;
	const role = board.board_members?.find((m) => m.user_id === userId)?.role;
	return role === 'owner' || role === 'editor';
}

function createListsStore() {
	let lists = $state<ListFieldsFragment[]>([]);
	let boards = $state<BoardFieldsFragment[]>([]);
	let archivedBoards = $state<BoardFieldsFragment[]>([]);
	let selectedBoard = $state<BoardFieldsFragment | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let initialized = $state(false);
	// Separate from `initialized` (lists): set once loadBoards() has an answer.
	let boardsInitialized = $state(false);

	const sortedLists = $derived(
		[...lists].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
	);

	const sortedBoards = $derived(
		[...boards].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
	);

	const sortedArchivedBoards = $derived(
		[...archivedBoards].sort(
			(a, b) => new Date(b.archived_at || 0).getTime() - new Date(a.archived_at || 0).getTime()
		)
	);

	// Cards carry only `list.board.id` (#222); the full board lives here once.
	function boardById(id: string | null | undefined): BoardFieldsFragment | undefined {
		if (!id) return undefined;
		if (selectedBoard?.id === id) return selectedBoard;
		return boards.find((b) => b.id === id) ?? archivedBoards.find((b) => b.id === id);
	}

	async function loadLists(): Promise<ListFieldsFragment[]> {
		if (!browser) return [];

		loading = true;
		error = null;

		try {
			// The user's own boards' lists, plus the open board's when it is a public one.
			lists = await call('getLists', { boardId: selectedBoard?.id });
			initialized = true;
			return lists;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error loading lists';
			error = message;
			console.error('Load lists error:', err);
			return [];
		} finally {
			loading = false;
		}
	}

	// On a fresh page load the board page asks for boards before the layout has
	// hydrated the user; wait for it instead of treating it as signed out (#206).
	async function signedIn(): Promise<boolean> {
		const { userStore } = await import('./user.svelte');
		const user = userStore.user ?? (await userStore.whenReady());
		return !!user?.id;
	}

	async function loadBoards(): Promise<BoardFieldsFragment[]> {
		if (!browser) return [];

		try {
			if (!(await signedIn())) {
				boards = [];
				selectedBoard = null;
				boardsInitialized = true;
				return [];
			}

			// Boards the user owns, belongs to or is invited to, never strangers' public ones.
			boards = await call('getBoards', {});

			if (boards.length > 0) {
				const { userStore } = await import('./user.svelte');
				const user = userStore.user;
				const lastBoardAlias = user?.settings?.lastBoardAlias;

				// A refresh (30 s poll, focus) must not swap the board the user is on:
				// lastBoardAlias/localStorage can point elsewhere (another tab or e2e
				// worker), which filtered every list off the page (#225).
				let selected: BoardFieldsFragment | undefined = selectedBoard
					? boards.find((b) => b.id === selectedBoard?.id)
					: undefined;

				if (!selected && lastBoardAlias) {
					selected = boards.find((b) => b.alias === lastBoardAlias);
				}

				if (!selected) {
					const savedId = localStorage.getItem('selectedBoardId');
					if (savedId) {
						selected = boards.find((b) => b.id === savedId);
					}
				}

				if (!selected) {
					selected = boards[0];
				}

				selectedBoard = selected || null;

				if (selected) {
					localStorage.setItem('selectedBoardId', selected.id);
				}
			} else {
				selectedBoard = null;
			}

			boardsInitialized = true;
			return boards;
		} catch (err) {
			displayMessage('Load boards error:' + err);
			return [];
		}
	}

	async function createList(
		name: string,
		boardId?: string
	): Promise<ListBoardStoreResult<ListFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!name.trim()) return { success: false, message: 'Name is required' };
		if (!boardId) return { success: false, message: 'Board is required' };

		try {
			const maxSortOrder = Math.max(
				...lists.filter((l) => l.board_id === boardId).map((l) => l.sort_order || 0),
				0
			);

			const newList = await call('createList', {
				boardId,
				name: name.trim(),
				sort_order: maxSortOrder + 1
			});
			lists = [...lists, newList];
			return { success: true, message: 'List created successfully', data: newList };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error creating list';
			console.error('Create list error:', err);
			return { success: false, message };
		}
	}

	async function updateList(
		id: string,
		updates: { name?: string; sort_order?: number; board_id?: string }
	): Promise<ListBoardStoreResult<ListFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const listIndex = lists.findIndex((l) => l.id === id);
		const originalList = listIndex !== -1 ? { ...lists[listIndex] } : null;

		if (listIndex !== -1) {
			lists[listIndex] = { ...lists[listIndex], ...updates };
		}

		try {
			const updatedList = await call('updateList', { id, set: updates });
			if (listIndex !== -1) lists[listIndex] = updatedList;
			return { success: true, message: 'List updated successfully', data: updatedList };
		} catch (err) {
			if (listIndex !== -1 && originalList) {
				lists[listIndex] = originalList;
			}
			const message = err instanceof Error ? err.message : 'Error updating list';
			console.error('Update list error:', err);
			return { success: false, message };
		}
	}

	async function deleteList(id: string): Promise<ListBoardStoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const { deleted } = await call('deleteList', { id });
			if (deleted) {
				lists = lists.filter((l) => l.id !== id);
				return { success: true, message: 'List deleted successfully' };
			}

			return { success: false, message: 'Failed to delete list' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error deleting list';
			console.error('Delete list error:', err);
			return { success: false, message };
		}
	}

	async function createBoard(name: string): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!name.trim()) return { success: false, message: 'Name is required' };

		// Free plan: cap the number of boards. Surfaced only when hit (soft upsell).
		const { userStore } = await import('./user.svelte');
		const { isPaid, FREE_LIMITS } = await import('$lib/config/plan');
		if (!isPaid(userStore.user) && boards.length >= FREE_LIMITS.boards) {
			const { upgradeStore } = await import('./upgrade.svelte');
			upgradeStore.trigger('boards');
			return { success: false, message: 'Board limit reached', upsell: true };
		}

		try {
			const maxSortOrder = Math.max(...boards.map((b) => b.sort_order || 0), 0);

			const newBoard = await call('createBoard', {
				name: name.trim(),
				sort_order: maxSortOrder + 1
			});
			boards = [...boards, newBoard];
			return { success: true, message: 'Board created successfully', data: newBoard };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error creating board';
			console.error('Create board error:', err);
			return { success: false, message };
		}
	}

	async function updateBoard(
		id: string,
		updates: Partial<
			Pick<
				BoardFieldsFragment,
				| 'name'
				| 'sort_order'
				| 'github'
				| 'is_public'
				| 'allow_public_comments'
				| 'settings'
				| 'archived_at'
				| 'client_id'
			>
		>
	): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const boardIndex = boards.findIndex((b) => b.id === id);
		const originalBoard = boardIndex !== -1 ? { ...boards[boardIndex] } : null;

		if (boardIndex !== -1) {
			boards[boardIndex] = { ...boards[boardIndex], ...updates };
		}

		try {
			const updatedBoard = await call('updateBoard', { id, set: updates });
			if (boardIndex !== -1) boards[boardIndex] = updatedBoard;
			return { success: true, message: 'Board updated successfully', data: updatedBoard };
		} catch (err) {
			if (boardIndex !== -1 && originalBoard) {
				boards[boardIndex] = originalBoard;
			}
			const message = err instanceof Error ? err.message : 'Error updating board';
			console.error('Update board error:', err);
			return { success: false, message };
		}
	}

	async function updateBoardVisibility(
		id: string,
		isPublic: boolean,
		allowPublicComments: boolean = false
	): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		return updateBoard(id, {
			is_public: isPublic,
			allow_public_comments: isPublic ? allowPublicComments : false
		});
	}

	async function deleteBoard(id: string): Promise<ListBoardStoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const { deleted } = await call('deleteBoard', { id });
			if (deleted) {
				boards = boards.filter((b) => b.id !== id);
				return { success: true, message: 'Board deleted successfully' };
			}

			return { success: false, message: 'Failed to delete board' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error deleting board';
			console.error('Delete board error:', err);
			return { success: false, message };
		}
	}

	async function loadArchivedBoards(): Promise<BoardFieldsFragment[]> {
		if (!browser) return [];

		try {
			if (!(await signedIn())) {
				archivedBoards = [];
				return [];
			}

			archivedBoards = await call('getBoards', { archived: true });
			return archivedBoards;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error loading archived boards';
			console.error('Load archived boards error:', err);
			displayMessage(message);
			return [];
		}
	}

	async function archiveBoard(id: string): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const boardIndex = boards.findIndex((b) => b.id === id);
		const board = boardIndex !== -1 ? boards[boardIndex] : null;
		if (!board) return { success: false, message: 'Board not found' };

		boards = boards.filter((b) => b.id !== id);
		const archivedBoard = { ...board, archived_at: new Date().toISOString() };
		archivedBoards = [...archivedBoards, archivedBoard];
		if (selectedBoard?.id === id) selectedBoard = null;

		try {
			const updatedBoard = await call('updateBoard', {
				id,
				set: { archived_at: archivedBoard.archived_at }
			});
			archivedBoards = archivedBoards.map((b) => (b.id === id ? updatedBoard : b));
			return { success: true, message: 'Board archived successfully', data: updatedBoard };
		} catch (err) {
			boards = [...boards, board];
			archivedBoards = archivedBoards.filter((b) => b.id !== id);
			const message = err instanceof Error ? err.message : 'Error archiving board';
			console.error('Archive board error:', err);
			return { success: false, message };
		}
	}

	async function restoreBoard(id: string): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const boardIndex = archivedBoards.findIndex((b) => b.id === id);
		const board = boardIndex !== -1 ? archivedBoards[boardIndex] : null;
		if (!board) return { success: false, message: 'Board not found' };

		archivedBoards = archivedBoards.filter((b) => b.id !== id);
		const restoredBoard = { ...board, archived_at: null };
		boards = [...boards, restoredBoard];

		try {
			const updatedBoard = await call('updateBoard', { id, set: { archived_at: null } });
			boards = boards.map((b) => (b.id === id ? updatedBoard : b));
			return { success: true, message: 'Board restored successfully', data: updatedBoard };
		} catch (err) {
			boards = boards.filter((b) => b.id !== id);
			archivedBoards = [...archivedBoards, board];
			const message = err instanceof Error ? err.message : 'Error restoring board';
			console.error('Restore board error:', err);
			return { success: false, message };
		}
	}

	// Fetch a single board by alias regardless of the switcher scope. Used when a
	// user opens a public board (or one shared to them) by direct URL that isn't in
	// their own board list — it selects the board for viewing without adding it to
	// the switcher. Returns the board, or null when not found / not readable.
	async function loadBoardByAlias(alias: string): Promise<BoardFieldsFragment | null> {
		if (!browser || !alias) return null;

		try {
			const board = await call('getBoard', { alias });
			if (board) {
				await setSelectedBoard(board);
			}
			return board;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error loading board';
			console.error('Load board by alias error:', err);
			displayMessage(message);
			return null;
		}
	}

	async function setSelectedBoard(board: BoardFieldsFragment | null) {
		selectedBoard = board;
		if (browser) {
			if (board) {
				localStorage.setItem('selectedBoardId', board.id);

				const { userStore } = await import('./user.svelte');
				const user = userStore.user;
				if (user?.id && board.alias) {
					try {
						const currentSettings = user.settings || {};
						await userStore.updateUser(
							user.id,
							{
								settings: { ...currentSettings, lastBoardAlias: board.alias }
							},
							true
						);
					} catch (err) {
						console.warn('[ListsStore] Failed to update lastBoardAlias, likely logged out', err);
					}
				}
			} else {
				localStorage.removeItem('selectedBoardId');
			}
		}
	}

	function clearError() {
		error = null;
	}

	function reset() {
		lists = [];
		boards = [];
		archivedBoards = [];
		selectedBoard = null;
		loading = false;
		error = null;
		initialized = false;
		boardsInitialized = false;
	}

	return {
		get lists() {
			return lists;
		},
		get boards() {
			return boards;
		},
		get archivedBoards() {
			return archivedBoards;
		},
		get sortedLists() {
			return sortedLists;
		},
		get sortedBoards() {
			return sortedBoards;
		},
		get sortedArchivedBoards() {
			return sortedArchivedBoards;
		},
		get selectedBoard() {
			return selectedBoard;
		},
		/** Owner or editor of the selected board (viewers are read-only, #239). */
		get canEditSelectedBoard() {
			return canEditBoard(selectedBoard, userStore.user?.id);
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get initialized() {
			return initialized;
		},
		get boardsInitialized() {
			return boardsInitialized;
		},

		boardById,
		loadLists,
		loadBoards,
		loadArchivedBoards,
		loadBoardByAlias,
		createList,
		updateList,
		deleteList,
		createBoard,
		updateBoard,
		updateBoardVisibility,
		deleteBoard,
		archiveBoard,
		restoreBoard,
		setSelectedBoard,
		clearError,
		reset
	};
}

export const listsStore = createListsStore();
