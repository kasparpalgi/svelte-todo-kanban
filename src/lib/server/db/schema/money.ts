/** @file src/lib/server/db/schema/money.ts */
// Clients, invoices and expenses (kept, owner's decision in #226). Amounts are REAL,
// the JS numbers the client already gets from Hasura's numeric.
import { sql } from 'drizzle-orm';
import { check, index, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { boards } from './boards';
import { todos } from './cards';
import { bool, createdAt, id, json, updatedAt } from './columns';
import { users } from './users';

const owner = () =>
	text()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' });

export const clients = sqliteTable(
	'clients',
	{
		id: id(),
		user_id: owner(),
		name: text().notNull(),
		company_name: text(),
		email: text(),
		phone: text(),
		address: text(),
		vat_number: text(),
		currency: text().notNull().default('EUR'),
		default_rate: real(),
		notes: text(),
		created_at: createdAt(),
		updated_at: updatedAt(),
		linked_user_id: text().references(() => users.id, { onDelete: 'set null' })
	},
	(t) => [index('clients_user_id_idx').on(t.user_id)]
);

export const invoice_companies = sqliteTable(
	'invoice_companies',
	{
		id: id(),
		user_id: owner(),
		name: text().notNull(),
		address: text(),
		vat_number: text(),
		vat_rate: real().notNull().default(0),
		is_default: bool().notNull().default(false),
		created_at: createdAt(),
		updated_at: updatedAt(),
		iban: text(),
		swift: text()
	},
	(t) => [index('invoice_companies_user_id_idx').on(t.user_id)]
);

export const invoices = sqliteTable(
	'invoices',
	{
		id: id(),
		user_id: owner(),
		client_id: text()
			.notNull()
			.references(() => clients.id, { onDelete: 'restrict' }),
		board_id: text()
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		invoice_number: text().notNull(),
		issued_date: text()
			.notNull()
			.default(sql`(date('now'))`),
		due_date: text(),
		currency: text().notNull().default('EUR'),
		hourly_rate: real().notNull().default(0),
		total_hours: real().notNull().default(0),
		total_amount: real().notNull().default(0),
		notes: text(),
		status: text().notNull().default('draft'),
		created_at: createdAt(),
		updated_at: updatedAt(),
		custom_fields: json<unknown[]>().notNull().default([]),
		company_id: text().references(() => invoice_companies.id, { onDelete: 'set null' })
	},
	(t) => [
		uniqueIndex('invoices_user_number_key').on(t.user_id, t.invoice_number),
		index('invoices_board_id_idx').on(t.board_id),
		check('invoices_status_check', sql`${t.status} IN ('draft', 'sent', 'paid', 'cancelled')`)
	]
);

export const invoice_items = sqliteTable(
	'invoice_items',
	{
		id: id(),
		invoice_id: text()
			.notNull()
			.references(() => invoices.id, { onDelete: 'cascade' }),
		todo_id: text().references(() => todos.id, { onDelete: 'set null' }),
		title: text().notNull(),
		hours: real().notNull().default(0),
		hourly_rate: real().notNull().default(0),
		amount: real().notNull().default(0),
		created_at: createdAt()
	},
	(t) => [index('invoice_items_invoice_id_idx').on(t.invoice_id)]
);

export const expenses = sqliteTable(
	'expenses',
	{
		id: id(),
		amount: real().notNull(),
		created_by: text()
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		board_id: text()
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		created_at: createdAt(),
		updated_at: updatedAt(),
		deleted_at: text(),
		description: text()
	},
	(t) => [index('expenses_board_id_idx').on(t.board_id)]
);

export const expense_splits = sqliteTable(
	'expense_splits',
	{
		id: id(),
		expense_id: text()
			.notNull()
			.references(() => expenses.id, { onDelete: 'cascade' }),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		amount: real().notNull()
	},
	(t) => [index('expense_splits_expense_id_idx').on(t.expense_id)]
);
