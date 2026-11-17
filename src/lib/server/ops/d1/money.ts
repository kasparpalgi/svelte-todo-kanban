/** @file src/lib/server/ops/d1/money.ts */
// A user's invoice clients and invoice companies on D1, same JSON as ops/money.ts. Only
// the owner sees them: every statement is scoped by `user_id`.
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { clients, invoice_companies } from '$lib/server/db/schema';
import { OpError } from '../op';
import type { D1Run } from './types';

/** The one row a scoped update or delete touched; 404 when it touched none. */
export async function one<T>(rows: Promise<T[]>): Promise<T> {
	const [row] = await rows;
	if (!row) throw new OpError(404, 'Not found');
	return row;
}

export const gone = (result: { meta: { changes: number } }) => {
	if (!result.meta.changes) throw new OpError(404, 'Not found');
	return { deleted: true };
};

/** `id = ? and user_id = ?`: a row of the caller's. */
export const owned = (
	table: { id: SQLiteColumn; user_id: SQLiteColumn },
	id: string,
	userId: string
): SQL => and(eq(table.id, id), eq(table.user_id, userId))!;

export const getClients: D1Run<'getClients'> = ({ d1, userId }) =>
	d1
		.select()
		.from(clients)
		.where(eq(clients.user_id, userId))
		.orderBy(sql`${clients.name} collate nocase`, clients.id);

export const createClient: D1Run<'createClient'> = ({ d1, userId }, input) =>
	one(
		d1
			.insert(clients)
			.values({ ...input, user_id: userId })
			.returning()
	);

export const updateClient: D1Run<'updateClient'> = ({ d1, userId }, { id, set }) =>
	one(
		d1
			.update(clients)
			.set(set)
			.where(owned(clients, id, userId))
			.returning()
	);

export const deleteClient: D1Run<'deleteClient'> = async ({ d1, userId }, { id }) =>
	gone(await d1.delete(clients).where(owned(clients, id, userId)));

// ---- Invoice companies (who the invoice is from)

export const getInvoiceCompanies: D1Run<'getInvoiceCompanies'> = ({ d1, userId }) =>
	d1
		.select()
		.from(invoice_companies)
		.where(eq(invoice_companies.user_id, userId))
		.orderBy(
			desc(invoice_companies.is_default),
			sql`${invoice_companies.name} collate nocase`,
			invoice_companies.id
		);

export const createInvoiceCompany: D1Run<'createInvoiceCompany'> = ({ d1, userId }, input) =>
	one(
		d1
			.insert(invoice_companies)
			.values({ ...input, user_id: userId })
			.returning()
	);

export const updateInvoiceCompany: D1Run<'updateInvoiceCompany'> = ({ d1, userId }, { id, set }) =>
	one(
		d1
			.update(invoice_companies)
			.set(set)
			.where(owned(invoice_companies, id, userId))
			.returning()
	);

export const deleteInvoiceCompany: D1Run<'deleteInvoiceCompany'> = async ({ d1, userId }, { id }) =>
	gone(await d1.delete(invoice_companies).where(owned(invoice_companies, id, userId)));
