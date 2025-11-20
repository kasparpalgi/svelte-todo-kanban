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
	let lists = $state<ListFieldsFragment[]>([]);
	let boards = $state<BoardFieldsFragment[]>([]);
	let selectedBoard = $state<BoardFieldsFragment | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let initialized = $state(false);

	const sortedLists = $derived(
		[...lists].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
	);

	const sortedBoards = $derived(
		[...boards].sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
	);

	async function loadLists(): Promise<ListFieldsFragment[]> {
		if (!browser) return [];

		loading = true;
		error = null;

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const data: GetListsQuery = await request(GET_LISTS, {
				where: {},
				order_by: [{ sort_order: Order_By.Asc }, { name: Order_By.Asc }]
			});

			lists = data.lists || [];
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

	async function loadBoards(): Promise<BoardFieldsFragment[]> {
		if (!browser) return [];

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const data: GetBoardsQuery = await request(GET_BOARDS, {
				where: {},
				order_by: [{ sort_order: Order_By.Asc }, { name: Order_By.Asc }]
			});

			boards = data.boards || [];

			if (boards.length > 0) {
				const { userStore } = await import('./user.svelte');
				const user = userStore.user;
				const lastBoardAlias = user?.settings?.lastBoardAlias;

				let selected: BoardFieldsFragment | undefined;

				if (lastBoardAlias) {
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

		try {
			const maxSortOrder = Math.max(...lists.map((l) => l.sort_order || 0), 0);

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
				lists = [...lists, newList];
				return {
					success: true,
					message: 'List created successfully',
					data: newList
				};
			}

			return { success: false, message: 'Failed to create list' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error creating list';
			console.error('Create list error:', err);
			return { success: false, message };
		}
	}

	async function updateList(
		id: string,
		updates: Partial<Pick<ListFieldsFragment, 'name' | 'sort_order' | 'board_id'>>
	): Promise<ListBoardStoreResult<ListFieldsFragment>> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const listIndex = lists.findIndex((l) => l.id === id);
		const originalList = listIndex !== -1 ? { ...lists[listIndex] } : null;

		if (listIndex !== -1) {
			lists[listIndex] = { ...lists[listIndex], ...updates };
		}

		try {
			const data: UpdateListMutation = await request(UPDATE_LIST, {
				where: { id: { _eq: id } },
				_set: updates
			});

			const updatedList = data.update_lists?.returning?.[0];
			if (updatedList) {
				if (listIndex !== -1) {
					lists[listIndex] = updatedList;
				}
				return {
					success: true,
					message: 'List updated successfully',
					data: updatedList
				};
			} else {
				if (listIndex !== -1 && originalList) {
					lists[listIndex] = originalList;
				}
				return { success: false, message: 'Failed to update list' };
			}
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
			const data: DeleteListMutation = await request(DELETE_LIST, {
				where: { id: { _eq: id } }
			});

			if (data.delete_lists?.affected_rows && data.delete_lists.affected_rows > 0) {
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

		try {
			const maxSortOrder = Math.max(...boards.map((b) => b.sort_order || 0), 0);

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
				boards = [...boards, newBoard];
				return {
					success: true,
					message: 'Board created successfully',
					data: newBoard
				};
			}

			return { success: false, message: 'Failed to create board' };
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
				| 'customer_invoice_details'
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
			console.log('[listsStore] updateBoard - Sending updates:', updates);
			const data: UpdateBoardMutation = await request(UPDATE_BOARD, {
				where: { id: { _eq: id } },
				_set: updates
			});
			console.log('[listsStore] updateBoard - Response data:', data);

			const updatedBoard = data.update_boards?.returning?.[0];
			console.log('[listsStore] updateBoard - Updated board:', updatedBoard);
			console.log('[listsStore] updateBoard - customer_invoice_details in response:', updatedBoard?.customer_invoice_details);

			if (updatedBoard) {
				if (boardIndex !== -1) {
					boards[boardIndex] = updatedBoard;
					console.log('[listsStore] updateBoard - Updated boards array, index:', boardIndex);
				}
				return {
					success: true,
					message: 'Board updated successfully',
					data: updatedBoard
				};
			} else {
				if (boardIndex !== -1 && originalBoard) {
					boards[boardIndex] = originalBoard;
				}
				return { success: false, message: 'Failed to update board' };
			}
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
			const data: DeleteBoardMutation = await request(DELETE_BOARD, {
				where: { id: { _eq: id } }
			});

			if (data.delete_boards?.affected_rows && data.delete_boards.affected_rows > 0) {
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
		selectedBoard = null;
		loading = false;
		error = null;
		initialized = false;
	}

	/**
	 * Update customer invoice details for a board
	 */
	async function updateBoardCustomerInvoiceDetails(
		boardId: string,
		customerDetails: {
			company_name?: string;
			code?: string;
			vat?: string;
			address?: string;
			contact_details?: string;
			hourly_rate?: number;
		}
	): Promise<ListBoardStoreResult<BoardFieldsFragment>> {
		return updateBoard(boardId, {
			customer_invoice_details: customerDetails as any
		});
	}

	return {
		get lists() {
			return lists;
		},
		get boards() {
			return boards;
		},
		get sortedLists() {
			return sortedLists;
		},
		get sortedBoards() {
			return sortedBoards;
		},
		get selectedBoard() {
			return selectedBoard;
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

		loadLists,
		loadBoards,
		createList,
		updateList,
		deleteList,
		createBoard,
		updateBoard,
		updateBoardVisibility,
		updateBoardCustomerInvoiceDetails,
		deleteBoard,
		setSelectedBoard,
		clearError,
		reset
	};
}

export const listsStore = createListsStore();
