/** @file src/lib/utils/expenseCalculations.ts */

import type { GetBoardExpensesQuery } from '$lib/graphql/generated/graphql';

type Expense = GetBoardExpensesQuery['expenses'][number];

export interface UserBalance {
	userId: string;
	userName: string;
	userImage: string | null;
	balance: number; // Positive = owed to user, Negative = user owes
}

export interface Settlement {
	fromUserId: string;
	fromUserName: string;
	toUserId: string;
	toUserName: string;
	amount: number;
}

/**
 * Calculate net balances for all users from expenses
 *
 * Algorithm:
 * 1. For each expense:
 *    - Payer adds: amount paid
 *    - Each split participant subtracts: their split amount
 * 2. Net balance = total paid - total owed
 * 3. Positive balance = others owe you, Negative = you owe others
 *
 * Example:
 * - User A pays $30, split equally between A, B, C (each owes $10)
 * - A: +$30 (paid) -$10 (owes) = +$20 (others owe A $20)
 * - B: +$0 (paid) -$10 (owes) = -$10 (B owes $10)
 * - C: +$0 (paid) -$10 (owes) = -$10 (C owes $10)
 */
export function calculateBalances(expenses: Expense[]): UserBalance[] {
	const balances = new Map<string, UserBalance>();

	for (const expense of expenses) {
		// Add amount paid by creator
		const creatorId = expense.created_by;
		const creator = expense.created;
		if (!balances.has(creatorId)) {
			balances.set(creatorId, {
				userId: creatorId,
				userName: creator?.name || 'Unknown',
				userImage: creator?.image || null,
				balance: 0
			});
		}
		const creatorBalance = balances.get(creatorId)!;
		creatorBalance.balance += Number(expense.amount);

		// Subtract split amounts from each participant
		for (const split of expense.expense_splits) {
			const userId = split.user_id;
			const user = split.user;
			if (!balances.has(userId)) {
				balances.set(userId, {
					userId,
					userName: user?.name || 'Unknown',
					userImage: user?.image || null,
					balance: 0
				});
			}
			const userBalance = balances.get(userId)!;
			userBalance.balance -= Number(split.amount);
		}
	}

	return Array.from(balances.values()).filter((b) => Math.abs(b.balance) > 0.01); // Filter out ~0 balances
}

/**
 * Get balances relative to a specific user
 * Returns who owes the user and who the user owes
 */
export function getBalancesForUser(
	expenses: Expense[],
	currentUserId: string
): {
	owesMe: Array<{ userId: string; userName: string; userImage: string | null; amount: number }>;
	iOwe: Array<{ userId: string; userName: string; userImage: string | null; amount: number }>;
	myBalance: number;
} {
	const allBalances = calculateBalances(expenses);
	const myBalance = allBalances.find((b) => b.userId === currentUserId);

	// For simplification: we'll show direct debts between users
	// A more complex version would calculate optimal settlements
	const owesMe: Array<{ userId: string; userName: string; userImage: string | null; amount: number }> = [];
	const iOwe: Array<{ userId: string; userName: string; userImage: string | null; amount: number }> = [];

	// Simple approach: calculate pairwise balances
	const pairwiseBalances = calculatePairwiseBalances(expenses);

	for (const [pair, amount] of pairwiseBalances.entries()) {
		const [user1, user2] = pair.split('::');
		if (user1 === currentUserId && amount > 0.01) {
			// user2 owes me
			const user = allBalances.find((b) => b.userId === user2);
			if (user) {
				owesMe.push({
					userId: user2,
					userName: user.userName,
					userImage: user.userImage,
					amount
				});
			}
		} else if (user2 === currentUserId && amount > 0.01) {
			// I owe user1
			const user = allBalances.find((b) => b.userId === user1);
			if (user) {
				iOwe.push({
					userId: user1,
					userName: user.userName,
					userImage: user.userImage,
					amount
				});
			}
		}
	}

	return {
		owesMe: owesMe.sort((a, b) => b.amount - a.amount),
		iOwe: iOwe.sort((a, b) => b.amount - a.amount),
		myBalance: myBalance?.balance || 0
	};
}

/**
 * Calculate pairwise balances between all user pairs
 * Returns Map with key "userId1::userId2" -> amount (user2 owes user1)
 */
function calculatePairwiseBalances(expenses: Expense[]): Map<string, number> {
	const pairwise = new Map<string, number>();

	for (const expense of expenses) {
		const paidBy = expense.created_by;
		const splits = expense.expense_splits;

		for (const split of splits) {
			const userId = split.user_id;
			if (userId === paidBy) continue; // Skip if same user

			// Determine consistent key (smaller ID first)
			const key = paidBy < userId ? `${paidBy}::${userId}` : `${userId}::${paidBy}`;
			const amount = Number(split.amount);

			const current = pairwise.get(key) || 0;
			if (paidBy < userId) {
				pairwise.set(key, current + amount); // user2 owes user1
			} else {
				pairwise.set(key, current - amount); // user1 owes user2
			}
		}
	}

	return pairwise;
}

/**
 * Suggest optimal settlements to minimize number of transactions
 * Uses a greedy algorithm to settle debts
 */
export function getSuggestedSettlements(expenses: Expense[]): Settlement[] {
	const balances = calculateBalances(expenses);

	// Separate creditors (positive balance) and debtors (negative balance)
	const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
	const debtors = balances
		.filter((b) => b.balance < -0.01)
		.sort((a, b) => a.balance - b.balance)
		.map((b) => ({ ...b, balance: Math.abs(b.balance) }));

	const settlements: Settlement[] = [];
	let i = 0;
	let j = 0;

	while (i < creditors.length && j < debtors.length) {
		const creditor = creditors[i];
		const debtor = debtors[j];

		const amount = Math.min(creditor.balance, debtor.balance);

		settlements.push({
			fromUserId: debtor.userId,
			fromUserName: debtor.userName,
			toUserId: creditor.userId,
			toUserName: creditor.userName,
			amount: Math.round(amount * 100) / 100 // Round to 2 decimals
		});

		creditor.balance -= amount;
		debtor.balance -= amount;

		if (creditor.balance < 0.01) i++;
		if (debtor.balance < 0.01) j++;
	}

	return settlements;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(amount);
}
