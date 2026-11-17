/** @file src/lib/server/ops/d1/invoices.ts */
// A user's invoices on D1, with the same rules as ops/invoices.ts: only the author sees
// and changes one, and the totals come from the cards' hours, not from the browser.
import { and, asc, count, desc, eq, gt, inArray, type SQL } from 'drizzle-orm';
import { canRead, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import {
	clients,
	invoice_companies,
	invoice_items,
	invoices,
	lists,
	todos
} from '$lib/server/db/schema';
import { OpError, type UserCtx } from '../op';
import { owned } from './money';
import { inChunks, inList } from './sql';
import type { D1Run } from './types';

type Ctx = UserCtx & { d1: D1 };

/** Invoices in the shape of Hasura's InvoiceFields fragment, newest first. */
const invoiceRows = (d1: D1, where: SQL) =>
	d1.query.invoices.findMany({
		where,
		orderBy: [desc(invoices.created_at), asc(invoices.id)],
		with: { client: true, company: true, items: true }
	});

/** Cards with logged hours on these lists of the board. */
async function billable(ctx: Ctx, boardId: string, listIds: string[], todoIds?: string[]) {
	await requireRole(ctx, boardId, canRead);
	const onBoard = ctx.d1.select({ id: lists.id }).from(lists).where(eq(lists.board_id, boardId));
	return ctx.d1.query.todos.findMany({
		columns: { id: true, title: true, actual_hours: true, list_id: true, completed_at: true },
		where: and(
			inArray(todos.list_id, onBoard),
			inList(todos.list_id, listIds),
			gt(todos.actual_hours, 0),
			todoIds && inList(todos.id, todoIds)
		),
		orderBy: [asc(todos.sort_order), asc(todos.id)],
		with: { list: { columns: { id: true, name: true } } }
	});
}

export const getInvoices: D1Run<'getInvoices'> = ({ d1, userId }, { boardId }) =>
	invoiceRows(
		d1,
		and(eq(invoices.user_id, userId), boardId ? eq(invoices.board_id, boardId) : undefined)!
	);

export const getTodosForInvoicing: D1Run<'getTodosForInvoicing'> = async (ctx, input) =>
	(await billable(ctx, input.boardId, input.listIds)).map((t) => ({ ...t, list: t.list! }));

/** How many invoices the caller issued on `today`, for the next invoice number. */
export const countInvoicesIssued: D1Run<'countInvoicesIssued'> = async ({ d1, userId }, input) => {
	const [row] = await d1
		.select({ n: count() })
		.from(invoices)
		.where(and(eq(invoices.issued_date, input.today), eq(invoices.user_id, userId)));
	return row?.n ?? 0;
};

export const createInvoice: D1Run<'createInvoice'> = async (ctx, input) => {
	const { d1, userId } = ctx;
	const [client, company] = await d1.batch([
		d1
			.select({ id: clients.id })
			.from(clients)
			.where(owned(clients, input.clientId, userId)),
		d1
			.select({ id: invoice_companies.id })
			.from(invoice_companies)
			.where(owned(invoice_companies, input.companyId ?? '', userId))
	]);
	if (!client.length) throw new OpError(400, 'Unknown client');
	if (input.companyId && !company.length) throw new OpError(400, 'Unknown company');

	const cards = await billable(ctx, input.boardId, input.listIds, input.todoIds);
	if (!cards.length) throw new OpError(400, 'No billable cards selected');
	const rate = input.hourlyRate;
	const id = crypto.randomUUID();
	const items = cards.map((card) => {
		const hours = Number(card.actual_hours) || 0;
		const row = { id: crypto.randomUUID(), invoice_id: id, todo_id: card.id, title: card.title };
		return { ...row, hours, hourly_rate: rate, amount: hours * rate };
	});
	const totalHours = items.reduce((sum, item) => sum + item.hours, 0);
	await d1.batch([
		d1.insert(invoices).values({
			id,
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
			status: 'draft'
		}),
		...inChunks(items, (rows) => d1.insert(invoice_items).values(rows))
	]);
	const [invoice] = await invoiceRows(d1, eq(invoices.id, id));
	return invoice;
};

export const updateInvoiceStatus: D1Run<'updateInvoiceStatus'> = async (ctx, { id, status }) => {
	const result = await ctx.d1
		.update(invoices)
		.set({ status })
		.where(owned(invoices, id, ctx.userId));
	if (!result.meta.changes) throw new OpError(404, 'Invoice not found');
	return { id, status };
};

export const deleteInvoice: D1Run<'deleteInvoice'> = async (ctx, { id }) => {
	const result = await ctx.d1.delete(invoices).where(owned(invoices, id, ctx.userId));
	if (!result.meta.changes) throw new OpError(404, 'Invoice not found'); // items cascade
	return { deleted: true };
};
