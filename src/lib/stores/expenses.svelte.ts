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
import type { ParsedCsvData, SplitwiseExpense } from '$lib/utils/splitwiseCsvParser';

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
				message: `Splits total (€${splitTotal}) must equal expense amount (€${amount})`
			};
		}

		try {
			// Note: created_by is automatically set by Hasura permissions using the session user
			const data: CreateExpenseMutation = await request(CREATE_EXPENSE, {
				object: {
					board_id: boardId,
					amount,
					description,
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

	/**
	 * Import expenses from Splitwise CSV
	 */
	async function importFromSplitwise(
		boardId: string,
		parsedData: ParsedCsvData,
		userMapping: Map<string, string>, // csvUserName -> boardMemberUserId
		currentUserId: string
	): Promise<{ success: boolean; message: string }> {
		if (!browser) return { success: false, message: 'Not in browser' };

		let successCount = 0;
		let failCount = 0;

		try {
			// Process each expense
			for (const csvExpense of parsedData.expenses) {
				try {
					// Convert Splitwise expense to our format
					// In Splitwise CSV: negative = owes, positive = owed
					// We need to determine who paid and how to split

					// Find who paid (the user with the most positive amount in this expense)
					let paidByUserId = currentUserId;
					let maxPositive = -Infinity;

					for (const [csvUserName, amount] of csvExpense.splits.entries()) {
						if (amount > maxPositive) {
							maxPositive = amount;
							const userId = userMapping.get(csvUserName);
							if (userId) {
								paidByUserId = userId;
							}
						}
					}

					// Calculate splits: convert Splitwise amounts to our format
					// In our system: splits represent how much each user owes
					const splits: Array<{ user_id: string; amount: number }> = [];

					for (const [csvUserName, csvAmount] of csvExpense.splits.entries()) {
						const userId = userMapping.get(csvUserName);
						if (!userId) continue;

						// Splitwise: negative = owes money
						// Our system: split amount = what user owes
						// So if csvAmount is negative, the absolute value is what they owe
						if (csvAmount < 0) {
							splits.push({
								user_id: userId,
								amount: Math.abs(csvAmount)
							});
						}
					}

					// If no splits (everyone paid their share), skip
					if (splits.length === 0) {
						console.log('[importFromSplitwise] Skipping expense with no splits:', csvExpense.description);
						continue;
					}

					// Add the expense
					const result = await addExpense(
						boardId,
						csvExpense.cost,
						paidByUserId,
						splits,
						csvExpense.description
					);

					if (result.success) {
						successCount++;
					} else {
						failCount++;
						console.error('[importFromSplitwise] Failed to add expense:', result.message);
					}
				} catch (error) {
					failCount++;
					console.error('[importFromSplitwise] Error processing expense:', error);
				}
			}

			console.log('[importFromSplitwise] Import complete:', { successCount, failCount });

			if (successCount > 0) {
				return {
					success: true,
					message: `Imported ${successCount} expense${successCount === 1 ? '' : 's'}${failCount > 0 ? `, ${failCount} failed` : ''}`
				};
			} else {
				return {
					success: false,
					message: `Failed to import expenses (${failCount} errors)`
				};
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Import failed';
			console.error('[importFromSplitwise] Error:', error);
			return { success: false, message };
		}
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
		getSuggested,
		importFromSplitwise
	};
}

export const expensesStore = createExpensesStore();
