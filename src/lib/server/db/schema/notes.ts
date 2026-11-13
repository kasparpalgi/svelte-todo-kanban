/** @file src/lib/server/db/schema/notes.ts */
// Notes (used by the Chrome extension), moved as they are.
import { type AnySQLiteColumn, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { boards } from './boards';
import { createdAt, id, updatedAt } from './columns';
import { users } from './users';

export const notes = sqliteTable(
	'notes',
	{
		id: id(),
		board_id: text()
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		user_id: text()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		title: text().notNull().default('Untitled Note'),
		content: text(),
		sort_order: integer().notNull().default(0),
		created_at: createdAt(),
		updated_at: updatedAt(),
		cover_image_url: text(),
		parent_id: text().references((): AnySQLiteColumn => notes.id, { onDelete: 'cascade' })
	},
	(t) => [index('notes_board_id_idx').on(t.board_id), index('notes_parent_id_idx').on(t.parent_id)]
);

export const note_uploads = sqliteTable(
	'note_uploads',
	{
		id: id(),
		note_id: text()
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		url: text().notNull(),
		created_at: createdAt()
	},
	(t) => [index('note_uploads_note_id_idx').on(t.note_id)]
);
