/** @file src/lib/server/db/relations.ts */
// Drizzle relations, so `db.query.<table>.findMany({ with })` returns the nested rows the
// stores read (one SQL statement with correlated JSON sub-selects). Add a table's
// relations when its ops move to D1 (#233).
import { relations } from 'drizzle-orm';
import { board_invitations, board_members, boards, labels, lists } from './schema/boards';
import { clients } from './schema/money';
import { users } from './schema/users';

export const boardsRelations = relations(boards, ({ one, many }) => ({
	user: one(users, { fields: [boards.user_id], references: [users.id] }),
	client: one(clients, { fields: [boards.client_id], references: [clients.id] }),
	labels: many(labels),
	lists: many(lists),
	board_members: many(board_members),
	board_invitations: many(board_invitations)
}));

export const boardMembersRelations = relations(board_members, ({ one }) => ({
	board: one(boards, { fields: [board_members.board_id], references: [boards.id] }),
	user: one(users, { fields: [board_members.user_id], references: [users.id] })
}));

export const boardInvitationsRelations = relations(board_invitations, ({ one }) => ({
	board: one(boards, { fields: [board_invitations.board_id], references: [boards.id] }),
	inviter: one(users, { fields: [board_invitations.inviter_id], references: [users.id] })
}));

export const labelsRelations = relations(labels, ({ one }) => ({
	board: one(boards, { fields: [labels.board_id], references: [boards.id] })
}));

export const listsRelations = relations(lists, ({ one }) => ({
	board: one(boards, { fields: [lists.board_id], references: [boards.id] })
}));
