/** @file src/lib/stores/expenses.svelte.ts */

import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import {
	GET_BOARD_EXPENSES,
	CREATE_EXPENSE,
	DELETE_EXPENSE
} from '$lib/graphql/documents';
import type {
	GetBoardExpensesQuery,
	CreateExpenseMutation,
	DeleteExpenseMutation
} from '$lib/graphql/generated/graphql';
import {
	calculateBalances,
	getBalancesForUser,
	getSuggestedSettlements
} from '$lib/utils/expenseCalculations';
import type { UserBalance, Settlement } from '$lib/utils/expenseCalculations';

type Expense = GetBoardExpensesQuery['expenses'][number];

interface ExpensesState {
	expenses: Expense[];
	loading: boolean;
	error: string | null;
	currentBoardId: string | null;
}

function createExpensesStore() {
	const state = $state<ExpensesState>({
		expenses: [],
		loading: false,
		error: null,
		currentBoardId: null
	});

	// Derived computed values
	const balances = $derived<UserBalance[]>(calculateBalances(state.expenses));

	/**
	 * Load all expenses for a board
	 */
	async function loadBoardExpenses(boardId: string) {
		if (!browser) return;

		state.loading = true;
		state.error = null;
		state.currentBoardId = boardId;

		try {
			const data: GetBoardExpensesQuery = await request(GET_BOARD_EXPENSES, {
				board_id: boardId
			});

			state.expenses = data.expenses || [];
			console.log('[expensesStore.loadBoardExpenses]', {
				boardId,
				count: state.expenses.length
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to load expenses';
			state.error = message;
			console.error('[expensesStore.loadBoardExpenses] Error:', error);
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Add a new expense with splits
	 */
	async function addExpense(
		boardId: string,
		amount: number,
		paidBy: string,
		splits: Array<{ user_id: string; amount: number }>,
		description?: string
	): Promise<{ success: boolean; message: string; data?: Expense }> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Validation: splits must total the expense amount
		const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
		if (Math.abs(splitTotal - amount) > 0.01) {
			return {
				success: false,
				message: `Splits total ($${splitTotal}) must equal expense amount ($${amount})`
			};
		}

		try {
			// Note: created_by is automatically set by Hasura permissions using the session user
			const data: CreateExpenseMutation = await request(CREATE_EXPENSE, {
				object: {
					board_id: boardId,
					amount,
					expense_splits: {
						data: splits
					}
				}
			});

			const newExpense = data.insert_expenses_one;
			if (!newExpense) {
				throw new Error('Failed to create expense');
			}

			// Optimistic update
			state.expenses = [newExpense, ...state.expenses];

			console.log('[expensesStore.addExpense]', {
				expenseId: newExpense.id,
				amount,
				splits: splits.length
			});

			return {
				success: true,
				message: 'Expense added',
				data: newExpense
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to add expense';
			console.error('[expensesStore.addExpense] Error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Delete an expense (soft delete)
	 */
	async function deleteExpense(
		expenseId: string
	): Promise<{ success: boolean; message: string }> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Find the expense
		const expenseIndex = state.expenses.findIndex((e) => e.id === expenseId);
		if (expenseIndex === -1) {
			return { success: false, message: 'Expense not found' };
		}

		const originalExpense = state.expenses[expenseIndex];

		// Optimistic update: remove from list
		state.expenses = state.expenses.filter((e) => e.id !== expenseId);

		try {
			const data: DeleteExpenseMutation = await request(DELETE_EXPENSE, {
				id: expenseId,
				deleted_at: new Date().toISOString()
			});

			if (!data.update_expenses_by_pk) {
				throw new Error('Failed to delete expense');
			}

			console.log('[expensesStore.deleteExpense]', { expenseId });

			return { success: true, message: 'Expense deleted' };
		} catch (error) {
			// Rollback on error
			state.expenses = [...state.expenses];
			state.expenses.splice(expenseIndex, 0, originalExpense);

			const message = error instanceof Error ? error.message : 'Failed to delete expense';
			console.error('[expensesStore.deleteExpense] Error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Create a settlement expense (one person pays another directly)
	 * Note: The current user (from session) is automatically set as created_by by Hasura
	 */
	async function settleUp(
		boardId: string,
		fromUserId: string,
		toUserId: string,
		amount: number
	): Promise<{ success: boolean; message: string; data?: Expense }> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Settlement is an expense where only the "to" user is in the split
		// The settlement represents that fromUser paid toUser
		return await addExpense(
			boardId,
			amount,
			fromUserId,
			[{ user_id: toUserId, amount }],
			'Settlement'
		);
	}

	/**
	 * Get balances for a specific user
	 */
	function getBalances(currentUserId: string) {
		return getBalancesForUser(state.expenses, currentUserId);
	}

	/**
	 * Get suggested settlements to minimize transactions
	 */
	function getSuggested() {
		return getSuggestedSettlements(state.expenses);
	}

	return {
		// State getters
		get expenses() {
			return state.expenses;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get currentBoardId() {
			return state.currentBoardId;
		},
		get balances() {
			return balances;
		},

		// Methods
		loadBoardExpenses,
		addExpense,
		deleteExpense,
		settleUp,
		getBalances,
		getSuggested
	};
}

export const expensesStore = createExpensesStore();
