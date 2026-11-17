/** @file src/lib/server/ops/d1/expenses.ts */
// Shared expenses on D1, with the same rules as ops/expenses.ts: the board's owner and
// members see and add them, and only the payer deletes one (soft).
import { and, asc, desc, eq, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { isMember, requireRole, roleOf } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { board_members, boards, expense_splits, expenses } from '$lib/server/db/schema';
import { OpError } from '../op';
import { inChunks } from './sql';
import type { D1Run } from './types';

const person = { columns: { id: true, name: true, username: true, image: true } } as const;

/** Expenses in the shape of Hasura's ExpenseFields fragment, newest first. */
const expenseRows = (d1: D1, where: SQL) =>
	d1.query.expenses.findMany({
		where,
		orderBy: [desc(expenses.created_at), asc(expenses.id)],
		with: {
			created: person,
			expense_splits: { with: { user: person } },
			board: { columns: { id: true, name: true, alias: true } }
		}
	});

/** The boards the user owns or is a member of, as a sub-select (not awaited: that runs it). */
const myBoards = (d1: D1, userId: string) =>
	d1
		.select({ id: boards.id })
		.from(boards)
		.where(
			or(
				eq(boards.user_id, userId),
				inArray(
					boards.id,
					d1
						.select({ id: board_members.board_id })
						.from(board_members)
						.where(eq(board_members.user_id, userId))
				)
			)
		);

export const getExpenses: D1Run<'getExpenses'> = async (ctx, { boardId }) => {
	const open = isNull(expenses.deleted_at);
	if (!boardId) {
		return expenseRows(
			ctx.d1,
			and(open, inArray(expenses.board_id, myBoards(ctx.d1, ctx.userId)))!
		);
	}
	await requireRole(ctx, boardId, isMember);
	return expenseRows(ctx.d1, and(open, eq(expenses.board_id, boardId))!);
};

export const createExpense: D1Run<'createExpense'> = async (ctx, input) => {
	const { boardId, amount, paidBy, description, splits } = input;
	await requireRole(ctx, boardId, isMember);
	for (const person of new Set([paidBy, ...splits.map((s) => s.user_id)])) {
		if (!isMember(await roleOf(ctx, boardId, person))) {
			throw new OpError(400, 'Everyone in an expense must be on the board');
		}
	}
	const id = crypto.randomUUID();
	const rows = splits.map((s) => ({ id: crypto.randomUUID(), expense_id: id, ...s }));
	await ctx.d1.batch([
		ctx.d1
			.insert(expenses)
			.values({ id, board_id: boardId, amount, created_by: paidBy, description }),
		...inChunks(rows, (chunk) => ctx.d1.insert(expense_splits).values(chunk))
	]);
	const [expense] = await expenseRows(ctx.d1, eq(expenses.id, id));
	return expense;
};

export const deleteExpense: D1Run<'deleteExpense'> = async ({ d1, userId }, { id }) => {
	const result = await d1
		.update(expenses)
		.set({ deleted_at: new Date().toISOString() })
		.where(
			and(
				eq(expenses.id, id),
				eq(expenses.created_by, userId),
				isNull(expenses.deleted_at),
				inArray(expenses.board_id, myBoards(d1, userId))
			)
		);
	if (!result.meta.changes) throw new OpError(404, 'Expense not found');
	return { deleted: true };
};
