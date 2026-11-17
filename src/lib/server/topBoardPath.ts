/** @file src/lib/server/topBoardPath.ts */
// Where a signed-in user lands: their last board, else their first own board, else
// the first board they are a member of. Never a stranger's public board (task 153).
import { eq } from 'drizzle-orm';
import { GET_USERS } from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import { DEFAULT_LOCALE } from '$lib/constants/locale';
import { users } from '$lib/server/db/schema';
import type { Ctx } from '$lib/server/ops/op';
import { callOp } from '$lib/server/ops/run';

type SessionLike = {
	user?: { id?: string | null; settings?: { lastBoardAlias?: string } | null } | null;
} | null;

/** The user's saved UI language, for building app URLs on the server. */
export async function userLocale(ctx: Ctx, userId: string): Promise<string> {
	if (ctx.d1) {
		const [row] = await ctx.d1
			.select({ locale: users.locale })
			.from(users)
			.where(eq(users.id, userId));
		return row?.locale || DEFAULT_LOCALE;
	}
	const data = await serverRequest(GET_USERS, { where: { id: { _eq: userId } }, limit: 1 });
	return data.users[0]?.locale || DEFAULT_LOCALE;
}

/** `ctx` carries the backend; its user is the session's. */
export async function getTopBoardPath(ctx: Ctx, session: SessionLike): Promise<string | null> {
	const userId = session?.user?.id;
	if (!userId) return null;
	ctx = { ...ctx, userId };
	const lastAlias = session?.user?.settings?.lastBoardAlias;

	try {
		const [locale, last] = await Promise.all([
			userLocale(ctx, userId),
			lastAlias ? callOp('getBoard', ctx, { alias: lastAlias }) : null
		]);

		let board = last;
		if (!board) {
			const boards = await callOp('getBoards', ctx, { archived: false });
			board =
				boards.find((b) => b.user.id === userId) ??
				boards.find((b) => b.board_members.some((m) => m.user_id === userId)) ??
				null;
		}
		return board?.user.username && board.alias
			? `/${locale}/${board.user.username}/${board.alias}`
			: null;
	} catch (error) {
		console.error('[getTopBoardPath] Error:', error);
		return null;
	}
}
