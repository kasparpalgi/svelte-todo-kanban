/** @file src/lib/server/ops/d1/notes.ts */
// A board's notes and their images on D1, with the same access rules as ops/notes.ts.
// Notes don't stamp the board: the poll is for cards.
import { asc, desc, eq, type SQL } from 'drizzle-orm';
import { canEdit, canRead, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { note_uploads, notes } from '$lib/server/db/schema';
import { OpError, type UserCtx } from '../op';
import { inList } from './sql';
import type { D1Run } from './types';

type Ctx = UserCtx & { d1: D1 };

// Hasura's NoteCoreFields: every column, its author, board and images.
const core = {
	with: {
		user: { columns: { id: true, name: true, username: true, image: true } },
		board: { columns: { id: true, name: true, alias: true } },
		note_uploads: { columns: { id: true, url: true, created_at: true } }
	}
} as const;

/** Notes in the shape of Hasura's NoteFields fragment. */
const noteRows = (d1: D1, where: SQL, limit?: number) =>
	d1.query.notes.findMany({
		where,
		orderBy: [asc(notes.sort_order), desc(notes.created_at), asc(notes.id)],
		limit,
		with: {
			...core.with,
			// The callback gets the sub-select's alias of `notes`, not the outer table.
			subnotes: { ...core, orderBy: (n, { asc }) => [asc(n.sort_order), asc(n.id)] }
		}
	});

async function noteRow(d1: D1, id: string) {
	const [note] = await noteRows(d1, eq(notes.id, id));
	if (!note) throw new OpError(404, 'Note not found');
	return note;
}

/** The one board all these notes are on; throws 404/400 otherwise. */
async function notesBoard(d1: D1, ids: string[]) {
	const unique = [...new Set(ids)];
	const found = await d1
		.select({ board_id: notes.board_id })
		.from(notes)
		.where(inList(notes.id, unique));
	if (found.length !== unique.length) throw new OpError(404, 'Note not found');
	if (new Set(found.map((n) => n.board_id)).size !== 1) {
		throw new OpError(400, 'Notes are on different boards');
	}
	return found[0].board_id;
}

async function editNotes(ctx: Ctx, ids: string[], parentId?: string | null) {
	const boardId = await notesBoard(ctx.d1, parentId ? [...ids, parentId] : ids);
	await requireRole(ctx, boardId, canEdit);
}

export const getNotes: D1Run<'getNotes'> = async (ctx, { boardId }) => {
	await requireRole(ctx, boardId, canRead);
	return noteRows(ctx.d1, eq(notes.board_id, boardId), 1000);
};

export const createNote: D1Run<'createNote'> = async (ctx, input) => {
	const { boardId, parentId, ...fields } = input;
	await requireRole(ctx, boardId, canEdit);
	if (parentId && (await notesBoard(ctx.d1, [parentId])) !== boardId) {
		throw new OpError(400, 'The parent note is on another board');
	}
	const id = crypto.randomUUID();
	await ctx.d1
		.insert(notes)
		.values({ id, board_id: boardId, parent_id: parentId, user_id: ctx.userId, ...fields });
	return noteRow(ctx.d1, id);
};

export const updateNote: D1Run<'updateNote'> = async (ctx, { id, set }) => {
	if (set.parent_id === id) throw new OpError(400, 'A note cannot be its own parent');
	await editNotes(ctx, [id], set.parent_id);
	if (Object.keys(set).length) await ctx.d1.update(notes).set(set).where(eq(notes.id, id));
	return noteRow(ctx.d1, id);
};

/** Sets sort_order 0..n-1 in the given order: the notes must share one board. */
export const reorderNotes: D1Run<'reorderNotes'> = async (ctx, { ids }) => {
	await editNotes(ctx, ids);
	const [first, ...rest] = ids.map((id, index) =>
		ctx.d1.update(notes).set({ sort_order: index }).where(eq(notes.id, id))
	);
	await ctx.d1.batch([first, ...rest]);
	const rows = new Map((await noteRows(ctx.d1, inList(notes.id, ids))).map((n) => [n.id, n]));
	return ids.map((id) => rows.get(id)!);
};

export const deleteNote: D1Run<'deleteNote'> = async (ctx, { id }) => {
	await editNotes(ctx, [id]);
	const result = await ctx.d1.delete(notes).where(eq(notes.id, id));
	return { deleted: result.meta.changes > 0 };
};

export const createNoteUpload: D1Run<'createNoteUpload'> = async (ctx, { noteId, url }) => {
	await editNotes(ctx, [noteId]);
	const [upload] = await ctx.d1.insert(note_uploads).values({ note_id: noteId, url }).returning({
		id: note_uploads.id,
		url: note_uploads.url,
		note_id: note_uploads.note_id,
		created_at: note_uploads.created_at
	});
	return upload;
};

export const deleteNoteUpload: D1Run<'deleteNoteUpload'> = async (ctx, { id }) => {
	const [found] = await ctx.d1
		.select({ note_id: note_uploads.note_id })
		.from(note_uploads)
		.where(eq(note_uploads.id, id));
	if (!found) throw new OpError(404, 'Image not found');
	await editNotes(ctx, [found.note_id]);
	const result = await ctx.d1.delete(note_uploads).where(eq(note_uploads.id, id));
	return { deleted: result.meta.changes > 0 };
};
