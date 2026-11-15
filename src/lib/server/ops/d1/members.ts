/** @file src/lib/server/ops/d1/members.ts */
// The member ops on D1, with the same access rules as ops/members.ts (#241). Like the
// Hasura ops, they do not stamp the board: the poll is for cards, not the sharing panel.
import { asc, eq } from 'drizzle-orm';
import { boardRole, canRead, isOwner, requireRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { board_members } from '$lib/server/db/schema';
import { OpError } from '../op';
import type { D1Run } from './types';

const user = {
	columns: { id: true, name: true, username: true, email: true, image: true }
} as const;

/** Members in the shape of Hasura's BoardMemberFields fragment. */
const memberRows = async (d1: D1, where: ReturnType<typeof eq>, limit?: number) =>
	(
		await d1.query.board_members.findMany({
			where,
			orderBy: [asc(board_members.created_at)],
			limit,
			with: { user }
		})
	).map((m) => ({ ...m, user: m.user! })); // user_id is NOT NULL with a foreign key

async function member(d1: D1, id: string) {
	const [row] = await d1
		.select({ board_id: board_members.board_id, user_id: board_members.user_id })
		.from(board_members)
		.where(eq(board_members.id, id));
	if (!row) throw new OpError(404, 'Member not found');
	return row;
}

export const getBoardMembers: D1Run<'getBoardMembers'> = async (ctx, { boardId }) => {
	await requireRole(ctx, boardId, canRead);
	return memberRows(ctx.d1, eq(board_members.board_id, boardId), 1000);
};

export const updateBoardMember: D1Run<'updateBoardMember'> = async (ctx, { id, role }) => {
	await requireRole(ctx, (await member(ctx.d1, id)).board_id, isOwner);
	await ctx.d1.update(board_members).set({ role }).where(eq(board_members.id, id));
	const [updated] = await memberRows(ctx.d1, eq(board_members.id, id));
	if (!updated) throw new OpError(404, 'Member not found');
	return updated;
};

export const removeBoardMember: D1Run<'removeBoardMember'> = async (ctx, { id }) => {
	const row = await member(ctx.d1, id);
	if (row.user_id !== ctx.userId && !isOwner(await boardRole(ctx, row.board_id))) {
		throw new OpError(403, 'Not allowed on this board');
	}
	const result = await ctx.d1.delete(board_members).where(eq(board_members.id, id));
	return { deleted: result.meta.changes > 0 };
};
