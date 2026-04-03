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
