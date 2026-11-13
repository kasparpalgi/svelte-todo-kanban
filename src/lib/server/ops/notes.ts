/** @file src/lib/server/ops/notes.ts */
// A board's notes and their images. Anyone who can see the board reads them; owners and
// editors change them (viewers are read-only, #226 Decisions 5).
import { z } from 'zod';
import {
	CREATE_NOTE,
	CREATE_NOTE_UPLOAD,
	DELETE_NOTE,
	DELETE_NOTE_UPLOAD,
	GET_NOTE_BOARDS,
	GET_NOTE_UPLOAD_NOTE,
	GET_NOTES,
	UPDATE_NOTE,
	UPDATE_NOTES
} from '$lib/graphql/documents';
import { Order_By } from '$lib/graphql/generated/graphql';
import { canEdit, canRead, requireRole } from '$lib/server/access';
import { defineOp, OpError, type UserCtx } from './op';

const title = z.string().max(500);
const content = z.string().max(1_000_000).nullable();
const setInput = z
	.object({
		title,
		content,
		cover_image_url: z.string().max(2_000).nullable(),
		parent_id: z.guid().nullable(),
		sort_order: z.number().int()
	})
	.partial()
	.strict();

/** The one board all these notes are on; throws 404/400 otherwise. */
async function notesBoard(ctx: UserCtx, ids: string[]) {
	const unique = [...new Set(ids)];
	const { notes } = await ctx.db(GET_NOTE_BOARDS, { ids: unique });
	if (notes.length !== unique.length) throw new OpError(404, 'Note not found');
	const boards = new Set(notes.map((n) => n.board_id));
	if (boards.size !== 1) throw new OpError(400, 'Notes are on different boards');
	return notes[0].board_id as string;
}

/** Edit rights on the note's board; a new parent must be on the same board. */
async function editNotes(ctx: UserCtx, ids: string[], parentId?: string | null) {
	const boardId = await notesBoard(ctx, parentId ? [...ids, parentId] : ids);
	await requireRole(ctx, boardId, canEdit);
	return boardId;
}

export const getNotes = defineOp({
	auth: 'user',
	input: z.object({ boardId: z.guid() }),
	async run(ctx, { boardId }) {
		await requireRole(ctx, boardId, canRead);
		const data = await ctx.db(GET_NOTES, {
			where: { board_id: { _eq: boardId } },
			order_by: [{ sort_order: Order_By.Asc }, { created_at: Order_By.Desc }],
			limit: 1000
		});
		return data.notes;
	}
});

export const createNote = defineOp({
	auth: 'user',
	input: z.object({
		boardId: z.guid(),
		parentId: z.guid().nullable().default(null),
		title,
		content: content.default(null),
		sort_order: z.number().int().default(0)
	}),
	async run(ctx, { boardId, parentId, title, content, sort_order }) {
		await requireRole(ctx, boardId, canEdit);
		if (parentId && (await notesBoard(ctx, [parentId])) !== boardId) {
			throw new OpError(400, 'The parent note is on another board');
		}
		const data = await ctx.db(CREATE_NOTE, {
			objects: [
				{ board_id: boardId, parent_id: parentId, title, content, sort_order, user_id: ctx.userId }
			]
		});
		const note = data.insert_notes?.returning[0];
		if (!note) throw new Error('insert_notes returned no row');
		return note;
	}
});

export const updateNote = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid(), set: setInput }),
	async run(ctx, { id, set }) {
		if (set.parent_id === id) throw new OpError(400, 'A note cannot be its own parent');
		await editNotes(ctx, [id], set.parent_id);
		const data = await ctx.db(UPDATE_NOTE, { where: { id: { _eq: id } }, _set: set });
		const note = data.update_notes?.returning[0];
		if (!note) throw new OpError(404, 'Note not found');
		return note;
	}
});

/** Sets sort_order 0..n-1 in the given order: the notes must share one board. */
export const reorderNotes = defineOp({
	auth: 'user',
	input: z.object({ ids: z.array(z.guid()).min(1).max(1000) }),
	async run(ctx, { ids }) {
		await editNotes(ctx, ids);
		const updates = ids.map((id, index) => ({
			where: { id: { _eq: id } },
			_set: { sort_order: index }
		}));
		const data = await ctx.db(UPDATE_NOTES, { updates });
		return (data.update_notes_many ?? []).flatMap((r) => r?.returning ?? []);
	}
});

export const deleteNote = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		await editNotes(ctx, [id]);
		const data = await ctx.db(DELETE_NOTE, { where: { id: { _eq: id } } });
		return { deleted: (data.delete_notes?.affected_rows ?? 0) > 0 };
	}
});

export const createNoteUpload = defineOp({
	auth: 'user',
	input: z.object({ noteId: z.guid(), url: z.string().min(1).max(2_000) }),
	async run(ctx, { noteId, url }) {
		await editNotes(ctx, [noteId]);
		const data = await ctx.db(CREATE_NOTE_UPLOAD, { objects: [{ note_id: noteId, url }] });
		const upload = data.insert_note_uploads?.returning[0];
		if (!upload) throw new Error('insert_note_uploads returned no row');
		return upload;
	}
});

export const deleteNoteUpload = defineOp({
	auth: 'user',
	input: z.object({ id: z.guid() }),
	async run(ctx, { id }) {
		const found = await ctx.db(GET_NOTE_UPLOAD_NOTE, { id });
		const noteId = found.note_uploads_by_pk?.note_id;
		if (!noteId) throw new OpError(404, 'Image not found');
		await editNotes(ctx, [noteId]);
		const data = await ctx.db(DELETE_NOTE_UPLOAD, { where: { id: { _eq: id } } });
		return { deleted: (data.delete_note_uploads?.affected_rows ?? 0) > 0 };
	}
});
