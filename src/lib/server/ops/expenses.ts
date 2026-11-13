/** @file src/lib/server/ops/expenses.ts */
// Shared expenses on a board (Splitwise-style). The board's owner and members, viewers
// included, see and add them; public visitors don't. Only the payer deletes one (soft).
import { z } from 'zod';
import {
	CREATE_EXPENSE,
	DELETE_EXPENSE,
	GET_ALL_USER_EXPENSES,
	GET_BOARD_EXPENSES
} from '$lib/graphql/documents';
import { isMember, requireRole, roleOf } from '$lib/server/access';
import { defineOp, OpError } from './op';

const money = z.number().positive().max(1e9);

export const getExpenses = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid().optional() }),
	async run(ctx, { boardId }) {
		if (!boardId) return (await ctx.db(GET_ALL_USER_EXPENSES, { userId: ctx.userId })).expenses;
		await requireRole(ctx, boardId, isMember);
		return (await ctx.db(GET_BOARD_EXPENSES, { board_id: boardId })).expenses;
	}
});

export const createExpense = defineOp({
	auth: 'user',
	input: z.object({
		boardId: z.guid(),
		amount: money,
		paidBy: z.guid(),
		description: z.string().max(500).nullable().optional(),
		splits: z
			.array(z.object({ user_id: z.guid(), amount: z.number().min(0) }))
			.min(1)
			.max(100)
	}),
	async run(ctx, { boardId, amount, paidBy, description, splits }) {
		await requireRole(ctx, boardId, isMember);
		const people = new Set([paidBy, ...splits.map((s) => s.user_id)]);
		for (const person of people) {
			if (!isMember(await roleOf(ctx, boardId, person))) {
				throw new OpError(400, 'Everyone in an expense must be on the board');
			}
		}
		const data = await ctx.db(CREATE_EXPENSE, {
			object: {
				board_id: boardId,
				amount,
				created_by: paidBy,
				description,
				expense_splits: { data: splits }
			}
		});
		if (!data.insert_expenses_one) throw new Error('insert_expenses_one returned no row');
		return data.insert_expenses_one;
	}
});

export const deleteExpense = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run({ db, userId }, { id }) {
		const data = await db(DELETE_EXPENSE, { id, userId, deleted_at: new Date().toISOString() });
		if (!data.update_expenses?.affected_rows) throw new OpError(404, 'Expense not found');
		return { deleted: true };
	}
});
