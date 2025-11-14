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
		// Fetch the user's current locale from database to avoid using stale session data
		let userLocale = DEFAULT_LOCALE;
		if (session?.user?.id) {
			const userData = (await request(
				GET_USERS,
				{
					where: { id: { _eq: session.user.id } },
					limit: 1
				},
				undefined,
				fetch
			)) as any;

			userLocale = userData.users?.[0]?.locale || DEFAULT_LOCALE;
			console.log('[getTopBoardPath] Fetched user locale from DB:', {
				userLocale,
				sessionLocale: session.user?.locale,
				userId: session.user.id
			});
		}

		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;

		if (lastBoardAlias) {
			const dataByAlias: GetBoardsQuery = await request(
				GET_BOARDS,
				{
					where: { alias: { _eq: lastBoardAlias } },
					limit: 1
				},
				undefined,
				fetch
			);

			if (dataByAlias.boards && dataByAlias.boards.length > 0) {
				const board = dataByAlias.boards[0];

				if (board.user?.username && board.alias) {
					return `/${userLocale}/${board.user.username}/${board.alias}`;
				}
			}
		}

		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			undefined,
			fetch
		);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];

			if (board.user?.username && board.alias) {
				return `/${userLocale}/${board.user.username}/${board.alias}`;
			}
		}

		return null;
	} catch (error) {
		console.error('[getTopBoardPath] Error:', error);
		return null;
	}
}
