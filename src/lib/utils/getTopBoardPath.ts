/** @file src/lib/utils/getTopBoardPath.ts */
import { request } from '$lib/graphql/client';
import { GET_BOARDS, GET_USERS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';
import { DEFAULT_LOCALE } from '$lib/constants/locale';

export async function getTopBoardPath(
	session: any,
	fetch: typeof globalThis.fetch
): Promise<string | null> {
	try {
		const userId = session?.user?.id;
		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;

		// Fetch user locale and last board in parallel
		const [userData, dataByAlias] = await Promise.all([
			session?.user?.id
				? (request(
						GET_USERS,
						{ where: { id: { _eq: session.user.id } }, limit: 1 },
						undefined,
						fetch
					) as Promise<any>)
				: Promise.resolve(null),
			lastBoardAlias
				? request(
						GET_BOARDS,
						{ where: { alias: { _eq: lastBoardAlias } }, limit: 1 },
						undefined,
						fetch
					)
				: Promise.resolve(null)
		]);

		const userLocale = (userData as any)?.users?.[0]?.locale || DEFAULT_LOCALE;

		if (dataByAlias) {
			const boardsByAlias = dataByAlias as GetBoardsQuery;
			if (boardsByAlias.boards && boardsByAlias.boards.length > 0) {
				const board = boardsByAlias.boards[0];
				if (board.user?.username && board.alias) {
					return `/${userLocale}/${board.user.username}/${board.alias}`;
				}
			}
		}

		// Fallback: land on a board the user actually owns or is a member of.
		// Never fall back to arbitrary public boards — the boards select permission
		// exposes every `is_public` board to all users, so an unfiltered query sent
		// new users (and fresh devices with no cached lastBoardAlias) to another
		// user's public board (e.g. "Ftwbihs's board"). See task 153.
		if (!userId) {
			return null;
		}

		const toBoardPath = (boards?: GetBoardsQuery['boards']): string | null => {
			const board = boards?.[0];
			if (board?.user?.username && board.alias) {
				return `/${userLocale}/${board.user.username}/${board.alias}`;
			}
			return null;
		};

		// 1. The user's own boards.
		const ownData: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				where: { user_id: { _eq: userId } },
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			undefined,
			fetch
		);
		const ownPath = toBoardPath(ownData.boards);
		if (ownPath) return ownPath;

		// 2. Boards the user is a member of.
		const memberData: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				where: { board_members: { user_id: { _eq: userId } } },
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			undefined,
			fetch
		);
		const memberPath = toBoardPath(memberData.boards);
		if (memberPath) return memberPath;

		return null;
	} catch (error) {
		console.error('[getTopBoardPath] Error:', error);
		return null;
	}
}
