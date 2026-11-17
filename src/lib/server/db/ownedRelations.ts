/** @file src/lib/server/db/ownedRelations.ts */
// Drizzle relations for notes, invoices and expenses (#257): the nested rows of Hasura's
// NoteFields, InvoiceFields and ExpenseFields fragments.
import { relations } from 'drizzle-orm';
import { boards } from './schema/boards';
import {
	expense_splits,
	expenses,
	invoice_companies,
	invoice_items,
	invoices
} from './schema/money';
import { clients } from './schema/money';
import { note_uploads, notes } from './schema/notes';
import { users } from './schema/users';

export const notesRelations = relations(notes, ({ one, many }) => ({
	user: one(users, { fields: [notes.user_id], references: [users.id] }),
	board: one(boards, { fields: [notes.board_id], references: [boards.id] }),
	note_uploads: many(note_uploads),
	parent: one(notes, {
		fields: [notes.parent_id],
		references: [notes.id],
		relationName: 'subnotes'
	}),
	subnotes: many(notes, { relationName: 'subnotes' })
}));

export const noteUploadsRelations = relations(note_uploads, ({ one }) => ({
	note: one(notes, { fields: [note_uploads.note_id], references: [notes.id] })
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	client: one(clients, { fields: [invoices.client_id], references: [clients.id] }),
	company: one(invoice_companies, {
		fields: [invoices.company_id],
		references: [invoice_companies.id]
	}),
	items: many(invoice_items)
}));

export const invoiceItemsRelations = relations(invoice_items, ({ one }) => ({
	invoice: one(invoices, { fields: [invoice_items.invoice_id], references: [invoices.id] })
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
	created: one(users, { fields: [expenses.created_by], references: [users.id] }),
	board: one(boards, { fields: [expenses.board_id], references: [boards.id] }),
	expense_splits: many(expense_splits)
}));

export const expenseSplitsRelations = relations(expense_splits, ({ one }) => ({
	expense: one(expenses, { fields: [expense_splits.expense_id], references: [expenses.id] }),
	user: one(users, { fields: [expense_splits.user_id], references: [users.id] })
}));
