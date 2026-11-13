/** @file src/lib/server/topBoardPath.ts */
// Where a signed-in user lands: their last board, else their first own board, else
// the first board they are a member of. Never a stranger's public board (task 153).
import { GET_USERS } from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import { DEFAULT_LOCALE } from '$lib/constants/locale';
import { getBoard, getBoards } from '$lib/server/ops/boards';

type SessionLike = {
	user?: { id?: string | null; settings?: { lastBoardAlias?: string } | null } | null;
} | null;

/** The user's saved UI language, for building app URLs on the server. */
export async function userLocale(userId: string): Promise<string> {
	const data = await serverRequest(GET_USERS, { where: { id: { _eq: userId } }, limit: 1 });
	return data.users[0]?.locale || DEFAULT_LOCALE;
}

export async function getTopBoardPath(session: SessionLike): Promise<string | null> {
	const userId = session?.user?.id;
	if (!userId) return null;
	const ctx = { userId, db: serverRequest };
	const lastAlias = session?.user?.settings?.lastBoardAlias;

	try {
		const [locale, last] = await Promise.all([
			userLocale(userId),
			lastAlias ? getBoard.run(ctx, { alias: lastAlias }) : null
		]);

		let board = last;
		if (!board) {
			const boards = await getBoards.run(ctx, { archived: false });
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
