/** @file src/lib/server/ops/money.ts */
// A user's invoice clients and invoice companies (who an invoice is from). Only the
// owner sees them; every query is scoped by `user_id` (#230).
import { z } from 'zod';
import {
	CREATE_CLIENT,
	CREATE_INVOICE_COMPANY,
	DELETE_CLIENT,
	DELETE_INVOICE_COMPANY,
	GET_CLIENTS,
	GET_INVOICE_COMPANIES,
	UPDATE_CLIENT,
	UPDATE_INVOICE_COMPANY
} from '$lib/graphql/documents';
import { defineOp } from './op';
import { byId, deleted, text, updated } from './rows';

const client = z
	.object({
		name: z.string().trim().min(1).max(200),
		company_name: text(200),
		email: text(320),
		phone: text(50),
		address: text(1_000),
		vat_number: text(50),
		currency: z.string().max(10).optional(),
		default_rate: z.number().min(0).nullable().optional(),
		linked_user_id: z.guid().nullable().optional(),
		notes: text(5_000)
	})
	.strict();

export const getClients = defineOp({
	auth: 'user',
	input: z.object({}),
	async run({ db, userId }) {
		return (await db(GET_CLIENTS, { userId })).clients;
	}
});

export const createClient = defineOp({
	auth: 'user',
	input: client,
	async run({ db, userId }, input) {
		const row = (await db(CREATE_CLIENT, { object: { ...input, user_id: userId } }))
			.insert_clients_one;
		if (!row) throw new Error('insert_clients_one returned no row');
		return row;
	}
});

export const updateClient = defineOp({
	auth: 'user',
	input: byId.extend({ set: client.partial() }),
	async run({ db, userId }, { id, set }) {
		return updated((await db(UPDATE_CLIENT, { id, userId, _set: set })).update_clients);
	}
});

export const deleteClient = defineOp({
	auth: 'user',
	input: byId,
	async run({ db, userId }, { id }) {
		return deleted((await db(DELETE_CLIENT, { id, userId })).delete_clients);
	}
});

// ---- Invoice companies (who the invoice is from)

const company = z
	.object({
		name: z.string().trim().min(1).max(200),
		address: text(1_000),
		vat_number: text(50),
		vat_rate: z.number().min(0).max(100).nullable().optional(),
		iban: text(50),
		swift: text(20),
		is_default: z.boolean().optional()
	})
	.strict();

export const getInvoiceCompanies = defineOp({
	auth: 'user',
	input: z.object({}),
	async run({ db, userId }) {
		return (await db(GET_INVOICE_COMPANIES, { userId })).invoice_companies;
	}
});

export const createInvoiceCompany = defineOp({
	auth: 'user',
	input: company,
	async run({ db, userId }, input) {
		const row = (await db(CREATE_INVOICE_COMPANY, { object: { ...input, user_id: userId } }))
			.insert_invoice_companies_one;
		if (!row) throw new Error('insert_invoice_companies_one returned no row');
		return row;
	}
});

export const updateInvoiceCompany = defineOp({
	auth: 'user',
	input: byId.extend({ set: company.partial() }),
	async run({ db, userId }, { id, set }) {
		const data = await db(UPDATE_INVOICE_COMPANY, { id, userId, _set: set });
		return updated(data.update_invoice_companies);
	}
});

export const deleteInvoiceCompany = defineOp({
	auth: 'user',
	input: byId,
	async run({ db, userId }, { id }) {
		return deleted((await db(DELETE_INVOICE_COMPANY, { id, userId })).delete_invoice_companies);
	}
});
