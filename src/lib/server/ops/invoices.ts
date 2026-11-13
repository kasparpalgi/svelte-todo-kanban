/** @file src/lib/server/ops/invoices.ts */
// A user's invoices, billed from the hours on a board's cards. Only the author sees and
// changes an invoice; the totals are computed here from the cards, not sent by the browser.
import { z } from 'zod';
import {
	CREATE_INVOICE_WITH_ITEMS,
	DELETE_INVOICE,
	GET_ALL_INVOICES,
	GET_BOARD_INVOICES,
	GET_INVOICE_PARTIES,
	GET_INVOICES_ISSUED_TODAY,
	GET_TODOS_FOR_INVOICING,
	UPDATE_INVOICE_STATUS
} from '$lib/graphql/documents';
import type { Todos_Bool_Exp } from '$lib/graphql/generated/graphql';
import { canRead, requireRole } from '$lib/server/access';
import { defineOp, OpError, type UserCtx } from './op';

const NO_ID = '00000000-0000-0000-0000-000000000000';
const date = z.iso.date();

/** Cards with logged hours on these lists of the board. */
async function billable(ctx: UserCtx, boardId: string, listIds: string[], todoIds?: string[]) {
	await requireRole(ctx, boardId, canRead);
	const where: Todos_Bool_Exp = {
		list: { board_id: { _eq: boardId } },
		list_id: { _in: listIds },
		actual_hours: { _gt: 0 }
	};
	if (todoIds) where.id = { _in: todoIds };
	return (await ctx.db(GET_TODOS_FOR_INVOICING, { where })).todos;
}

export const getInvoices = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid().optional() }),
	async run({ db, userId }, { boardId }) {
		if (!boardId) return (await db(GET_ALL_INVOICES, { userId })).invoices;
		return (await db(GET_BOARD_INVOICES, { board_id: boardId, userId })).invoices;
	}
});

export const getTodosForInvoicing = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid(), listIds: z.array(z.guid()).max(500) }),
	run(ctx, { boardId, listIds }) {
		return billable(ctx, boardId, listIds);
	}
});

/** How many invoices the caller issued on `today`, for the next invoice number. */
export const countInvoicesIssued = defineOp({
	auth: 'user',
	input: z.object({ today: date }),
	async run({ db, userId }, { today }) {
		const data = await db(GET_INVOICES_ISSUED_TODAY, { today, userId });
		return data.invoices_aggregate.aggregate?.count ?? 0;
	}
});

export const createInvoice = defineOp({
	auth: 'user',
	input: z.object({
		boardId: z.guid(),
		listIds: z.array(z.guid()).max(500),
		todoIds: z.array(z.guid()).min(1).max(1000),
		clientId: z.guid(),
		companyId: z.guid().nullable().default(null),
		invoiceNumber: z.string().trim().min(1).max(50),
		issuedDate: date,
		dueDate: date.nullable().default(null),
		currency: z.string().min(1).max(10),
		hourlyRate: z.number().min(0),
		notes: z.string().max(5_000).nullable().default(null),
		customFields: z
			.array(z.object({ label: z.string().max(200), value: z.string().max(1_000) }))
			.max(50)
			.default([])
	}),
	async run(ctx, input) {
		const { db, userId } = ctx;
		const parties = await db(GET_INVOICE_PARTIES, {
			clientId: input.clientId,
			companyId: input.companyId ?? NO_ID,
			userId
		});
		if (!parties.clients.length) throw new OpError(400, 'Unknown client');
		if (input.companyId && !parties.invoice_companies.length) {
			throw new OpError(400, 'Unknown company');
		}

		const todos = await billable(ctx, input.boardId, input.listIds, input.todoIds);
		if (!todos.length) throw new OpError(400, 'No billable cards selected');
		const rate = input.hourlyRate;
		const items = todos.map((todo) => {
			const hours = Number(todo.actual_hours) || 0;
			return {
				todo_id: todo.id,
				title: todo.title,
				hours,
				hourly_rate: rate,
				amount: hours * rate
			};
		});
		const totalHours = items.reduce((sum, item) => sum + item.hours, 0);

		const data = await db(CREATE_INVOICE_WITH_ITEMS, {
			invoice: {
				user_id: userId,
				board_id: input.boardId,
				client_id: input.clientId,
				company_id: input.companyId,
				invoice_number: input.invoiceNumber,
				issued_date: input.issuedDate,
				due_date: input.dueDate,
				currency: input.currency,
				hourly_rate: rate,
				total_hours: totalHours,
				total_amount: totalHours * rate,
				notes: input.notes,
				custom_fields: input.customFields,
				status: 'draft',
				items: { data: items }
			}
		});
		if (!data.insert_invoices_one) throw new Error('insert_invoices_one returned no row');
		return data.insert_invoices_one;
	}
});

export const updateInvoiceStatus = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid(), status: z.enum(['draft', 'sent', 'paid', 'cancelled']) }),
	async run({ db, userId }, { id, status }) {
		const data = await db(UPDATE_INVOICE_STATUS, { id, userId, status });
		if (!data.update_invoices?.affected_rows) throw new OpError(404, 'Invoice not found');
		return { id, status };
	}
});

export const deleteInvoice = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run({ db, userId }, { id }) {
		const data = await db(DELETE_INVOICE, { id, userId });
		if (!data.delete_invoices?.affected_rows) throw new OpError(404, 'Invoice not found');
		return { deleted: true };
	}
});
