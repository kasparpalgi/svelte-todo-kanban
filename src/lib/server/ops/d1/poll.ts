/** @file src/lib/server/ops/d1/poll.ts */
// The 30 s poll on D1: one statement, the same `board` stamp parts as the Hasura op.
import { sql } from 'drizzle-orm';
import { boardRole, canRead } from '$lib/server/access';
import type { D1Run } from './types';

const unread = (userId: string) =>
	sql`(select count(*) from notifications where user_id = ${userId} and is_read = 0)`;

export const poll: D1Run<'poll'> = async (ctx, { boardId }) => {
	const { d1, userId } = ctx;
	if (!boardId || !canRead(await boardRole(ctx, boardId))) {
		const row = await d1.get<{ unread: number }>(sql`select ${unread(userId)} as unread`);
		return { board: null, unread: row?.unread ?? 0 };
	}
	// The card count and newest card stamp see the runner's direct writes until #231 drops
	// them; on the biggest board they cost ~570 rows read per poll.
	const row = await d1.get<{
		unread: number;
		changed_at: string | null;
		updated_at: string | null;
		cards: number;
		newest: string | null;
	}>(sql`select ${unread(userId)} as unread, b.changed_at, b.updated_at,
		(select count(*) from todos t join lists l on l.id = t.list_id where l.board_id = b.id) as cards,
		(select max(t.updated_at) from todos t join lists l on l.id = t.list_id where l.board_id = b.id) as newest
		from boards b where b.id = ${boardId}`);
	const board = [row?.changed_at, row?.updated_at, row?.cards ?? 0, row?.newest].join('|');
	return { board, unread: row?.unread ?? 0 };
};
