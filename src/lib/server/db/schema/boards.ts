/** @file src/lib/server/db/schema/boards.ts */
// Boards and sharing. Changes from Postgres: `github` (JSON text matched with ILIKE) is
// now `github_repo` ("owner/name", exact match); no invitation email-tracking columns.
import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { bool, createdAt, id, json, NOW, updatedAt } from './columns';
import { clients } from './money';
import { users } from './users';

export const boards = sqliteTable(
	'boards',
	{
		id: id(),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		sort_order: integer().notNull().default(1),
		created_at: createdAt(),
		updated_at: updatedAt(),
		alias: text().notNull().unique(),
		// The linked repo as "owner/name". The `github` JSON the client reads is built from it.
		github_repo: text(),
		is_public: bool().notNull().default(false),
		allow_public_comments: bool().notNull().default(false),
		settings: json<Record<string, unknown>>().notNull().default({ enable_hour_tracking: false }),
		customer_invoice_details: json(),
		archived_at: text(),
		client_id: text().references(() => clients.id, { onDelete: 'set null' }),
		// Bumped by every card, comment, label and list write: the 30 s poll reads only this.
		changed_at: text().notNull().default(NOW)
	},
	(t) => [
		index('boards_user_id_idx').on(t.user_id),
		index('boards_github_repo_idx')
			.on(t.github_repo)
			.where(sql`${t.github_repo} IS NOT NULL`)
	]
);

export const board_members = sqliteTable(
	'board_members',
	{
		id: id(),
		board_id: text()
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: text().notNull(),
		created_at: createdAt(),
		updated_at: updatedAt()
	},
	(t) => [
		uniqueIndex('board_members_board_user_key').on(t.board_id, t.user_id),
		index('board_members_user_id_idx').on(t.user_id),
		check('board_members_role_check', sql`${t.role} IN ('owner', 'editor', 'viewer')`)
	]
);

export const board_invitations = sqliteTable(
	'board_invitations',
	{
		id: id(),
		board_id: text()
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		inviter_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		invitee_email: text(),
		invitee_username: text(),
		role: text().notNull(),
		status: text().notNull().default('pending'),
		token: text().unique(),
		created_at: createdAt(),
		updated_at: updatedAt(),
		expires_at: text()
			.notNull()
			.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+7 days'))`)
	},
	(t) => [
		index('board_invitations_board_id_idx').on(t.board_id),
		index('board_invitations_invitee_email_idx').on(t.invitee_email),
		index('board_invitations_invitee_username_idx').on(t.invitee_username),
		check('board_invitations_role_check', sql`${t.role} IN ('editor', 'viewer')`),
		check(
			'board_invitations_status_check',
			sql`${t.status} IN ('pending', 'accepted', 'declined', 'cancelled')`
		),
		check(
			'board_invitations_invitee_check',
			sql`${t.invitee_email} IS NOT NULL OR ${t.invitee_username} IS NOT NULL`
		)
	]
);

export const labels = sqliteTable(
	'labels',
	{
		id: id(),
		board_id: text()
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		color: text().notNull(),
		sort_order: integer().default(0),
		created_at: text().default(NOW),
		updated_at: text().default(NOW)
	},
	(t) => [index('labels_board_id_idx').on(t.board_id)]
);

export const lists = sqliteTable(
	'lists',
	{
		id: id(),
		name: text().notNull(),
		sort_order: integer().notNull(),
		created_at: createdAt(),
		updated_at: updatedAt(),
		board_id: text().references(() => boards.id, { onDelete: 'cascade' })
	},
	(t) => [index('lists_board_id_idx').on(t.board_id)]
);
