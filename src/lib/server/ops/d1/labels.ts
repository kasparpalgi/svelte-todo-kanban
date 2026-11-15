/** @file src/lib/server/ops/d1/labels.ts */
// The label ops on D1, with the same access rules as ops/labels.ts (#241).
import { eq } from 'drizzle-orm';
import { canEdit, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { labels } from '$lib/server/db/schema';
import { OpError } from '../op';
import { stamp } from './lists';
import type { D1Run } from './types';

async function labelBoard(d1: D1, id: string) {
	const [row] = await d1
		.select({ board_id: labels.board_id })
		.from(labels)
		.where(eq(labels.id, id));
	if (!row) throw new OpError(404, 'Label not found');
	return row.board_id;
}

const labelRow = async (d1: D1, id: string) =>
	(await d1.select().from(labels).where(eq(labels.id, id)))[0];

export const createLabel: D1Run<'createLabel'> = async (ctx, { boardId, name, color }) => {
	await requireRole(ctx, boardId, canEdit);
	const id = crypto.randomUUID();
	await ctx.d1.batch([
		ctx.d1.insert(labels).values({ id, board_id: boardId, name, color }),
		stamp(ctx.d1, [boardId])
	]);
	const label = await labelRow(ctx.d1, id);
	if (!label) throw new Error('created label not found');
	return label;
};

// No `updated_at` bump: Postgres has no update trigger on labels.
export const updateLabel: D1Run<'updateLabel'> = async (ctx, { id, set }) => {
	const boardId = await labelBoard(ctx.d1, id);
	await requireRole(ctx, boardId, canEdit);
	const stamped = stamp(ctx.d1, [boardId]);
	await (Object.keys(set).length
		? ctx.d1.batch([ctx.d1.update(labels).set(set).where(eq(labels.id, id)), stamped])
		: stamped);
	const label = await labelRow(ctx.d1, id);
	if (!label) throw new OpError(404, 'Label not found');
	return label;
};

export const deleteLabel: D1Run<'deleteLabel'> = async (ctx, { id }) => {
	const boardId = await labelBoard(ctx.d1, id);
	await requireRole(ctx, boardId, canEdit);
	const [result] = await ctx.d1.batch([
		ctx.d1.delete(labels).where(eq(labels.id, id)),
		stamp(ctx.d1, [boardId])
	]);
	return { deleted: result.meta.changes > 0 };
};
