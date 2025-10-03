/** @file src/lib/stores/lists.svelte.ts */
import {
	GET_LISTS,
	GET_BOARDS,
	CREATE_LIST,
	UPDATE_LIST,
	DELETE_LIST,
	CREATE_BOARD,
	UPDATE_BOARD,
	DELETE_BOARD
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	GetListsQuery,
	GetBoardsQuery,
	CreateListMutation,
	UpdateListMutation,
	DeleteListMutation,
	CreateBoardMutation,
	UpdateBoardMutation,
	DeleteBoardMutation,
	ListFieldsFragment,
	BoardFieldsFragment
} from '$lib/graphql/generated/graphql';
import type { ListBoardStoreResult, ListsState } from '$lib/types/listBoard';
import { displayMessage } from './errorSuccess.svelte';

function createListsStore() {
	const state = $state<ListsState & { selectedBoard: BoardFieldsFragment | null }>({
		lists: [],
		boards: [],
		loading: false,
		error: null,
		initialized: false,
		selectedBoard: null
	});

	async function loadLists(): Promise<ListFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const data: GetListsQuery = await request(GET_LISTS, {
				where: {},
				order_by: [{ sort_order: Order_By.Asc }, { name: Order_By.Asc }]
			});

			state.lists = data.lists || [];
			state.initialized = true;
			return state.lists;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading lists';
			state.error = message;
			console.error('Load lists error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function loadBoards(): Promise<BoardFieldsFragment[]> {
		if (!browser) return [];

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const data: GetBoardsQuery = await request(GET_BOARDS, {
				where: {},
				order_by: [{ sort_order: Order_By.Asc }, { name: Order_By.Asc }]
			});

			state.boards = data.boards || [];

			// Restore selectedBoard from localStorage or 1st one
			if (state.boards.length > 0) {
				const savedId = localStorage.getItem('selectedBoardId');
				const savedBoard = state.boards.find((b) => b.id === savedId);

				state.selectedBoard = savedBoard || state.boards[0];

				if (!savedBoard) {
					localStorage.setItem('selectedBoardId', state.selectedBoard.id);
				}
			} else {
				state.selectedBoard = null;
			}

			return state.boards;
		} catch (error) {
			displayMessage('Load boards error:' + error);
			return [];
		}
	}

	async function createList(
		name: string,
		boardId?: string
	): Promise<ListBoardStoreResult<ListFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!name.trim()) return { success: false, message: 'Name is required' };

		try {
			const maxSortOrder = Math.max(...state.lists.map((l) => l.sort_order || 0), 0);

			const data: CreateListMutation = await request(CREATE_LIST, {
				objects: [
					{
						name: name.trim(),
						sort_order: maxSortOrder + 1,
						...(boardId && { board_id: boardId })
					}
				]
			});

			const newList = data.insert_lists?.returning?.[0];
			if (newList) {
				state.lists = [...state.lists, newList];
				return {
					success: true,
					message: 'List created successfully',
					data: newList
				};
			}

			return { success: false, message: 'Failed to create list' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error creating list';
			console.error('Create list error:', error);
			return { success: false, message };
		}
	}

	async function updateList(
		id: string,
		updates: Partial<Pick<ListFieldsFragment, 'name' | 'sort_order' | 'board_id'>>
	): Promise<ListBoardStoreResult<ListFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const listIndex = state.lists.findIndex((l) => l.id === id);
		const originalList = listIndex !== -1 ? { ...state.lists[listIndex] } : null;

		// Optimistic update
		if (listIndex !== -1) {
			state.lists[listIndex] = { ...state.lists[listIndex], ...updates };
		}

		try {
			const data: UpdateListMutation = await request(UPDATE_LIST, {
				where: { id: { _eq: id } },
				_set: updates
			});

			const updatedList = data.update_lists?.returning?.[0];
			if (updatedList) {
				if (listIndex !== -1) {
					state.lists[listIndex] = updatedList;
				}
				return {
					success: true,
					message: 'List updated successfully',
					data: updatedList
				};
			} else {
				if (listIndex !== -1 && originalList) {
					state.lists[listIndex] = originalList;
				}
				return { success: false, message: 'Failed to update list' };
			}
		} catch (error) {
			if (listIndex !== -1 && originalList) {
				state.lists[listIndex] = originalList;
			}
			const message = error instanceof Error ? error.message : 'Error updating list';
			console.error('Update list error:', error);
			return { success: false, message };
		}
	}

	async function deleteList(id: string): Promise<ListBoardStoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data: DeleteListMutation = await request(DELETE_LIST, {
				where: { id: { _eq: id } }
			});

			if (data.delete_lists?.affected_rows && data.delete_lists.affected_rows > 0) {
				state.lists = state.lists.filter((l) => l.id !== id);
				return { success: true, message: 'List deleted successfully' };
			}

			return { success: false, message: 'Failed to delete list' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error deleting list';
			console.error('Delete list error:', error);
			return { success: false, message };
		}
	}

	async function createBoard(name: string): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!name.trim()) return { success: false, message: 'Name is required' };

		try {
			const maxSortOrder = Math.max(...state.boards.map((b) => b.sort_order || 0), 0);

			const data: CreateBoardMutation = await request(CREATE_BOARD, {
				objects: [
					{
						name: name.trim(),
						sort_order: maxSortOrder + 1
					}
				]
			});

			const newBoard = data.insert_boards?.returning?.[0];
			if (newBoard) {
				state.boards = [...state.boards, newBoard];
				return {
					success: true,
					message: 'Board created successfully',
					data: newBoard
				};
			}

			return { success: false, message: 'Failed to create board' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error creating board';
			console.error('Create board error:', error);
			return { success: false, message };
		}
	}

	async function updateBoard(
		id: string,
		updates: Partial<
			Pick<BoardFieldsFragment, 'name' | 'sort_order' | 'github' | 'is_public' | 'allow_public_comments'>
		>
	): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const boardIndex = state.boards.findIndex((b) => b.id === id);
		const originalBoard = boardIndex !== -1 ? { ...state.boards[boardIndex] } : null;

		// Optimistic update
		if (boardIndex !== -1) {
			state.boards[boardIndex] = { ...state.boards[boardIndex], ...updates };
		}

		try {
			const data: UpdateBoardMutation = await request(UPDATE_BOARD, {
				where: { id: { _eq: id } },
				_set: updates
			});

			const updatedBoard = data.update_boards?.returning?.[0];
			if (updatedBoard) {
				if (boardIndex !== -1) {
					state.boards[boardIndex] = updatedBoard;
				}
				return {
					success: true,
					message: 'Board updated successfully',
					data: updatedBoard
				};
			} else {
				if (boardIndex !== -1 && originalBoard) {
					state.boards[boardIndex] = originalBoard;
				}
				return { success: false, message: 'Failed to update board' };
			}
		} catch (error) {
			if (boardIndex !== -1 && originalBoard) {
				state.boards[boardIndex] = originalBoard;
			}
			const message = error instanceof Error ? error.message : 'Error updating board';
			console.error('Update board error:', error);
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
			const data: DeleteBoardMutation = await request(DELETE_BOARD, {
				where: { id: { _eq: id } }
			});

			if (data.delete_boards?.affected_rows && data.delete_boards.affected_rows > 0) {
				state.boards = state.boards.filter((b) => b.id !== id);
				return { success: true, message: 'Board deleted successfully' };
			}

			return { success: false, message: 'Failed to delete board' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error deleting board';
			console.error('Delete board error:', error);
			return { success: false, message };
		}
	}

	const sortedLists = $derived(
		[...state.lists].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
	);

	const sortedBoards = $derived(
		[...state.boards].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
	);

	return {
		get lists() {
			return state.lists;
		},
		get boards() {
			return state.boards;
		},
		get sortedLists() {
			return sortedLists;
		},
		get sortedBoards() {
			return sortedBoards;
		},
		get selectedBoard() {
			return state.selectedBoard;
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

		setSelectedBoard(board: BoardFieldsFragment | null) {
			state.selectedBoard = board;
			if (browser) {
				if (board) {
					localStorage.setItem('selectedBoardId', board.id);
				} else {
					localStorage.removeItem('selectedBoardId');
				}
			}
		},

		loadLists,
		loadBoards,
		createList,
		updateList,
		deleteList,
		createBoard,
		updateBoard,
		updateBoardVisibility,
		deleteBoard,
		clearError: () => {
			state.error = null;
		},
		reset: () => {
			state.lists = [];
			state.boards = [];
			state.selectedBoard = null;
			state.loading = false;
			state.error = null;
			state.initialized = false;
		}
	};
}

export const listsStore = createListsStore();
