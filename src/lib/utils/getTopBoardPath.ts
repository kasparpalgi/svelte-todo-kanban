/** @file src/lib/utils/getTopBoardPath.ts */
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

export async function getTopBoardPath(
	session: any,
	fetch: typeof globalThis.fetch
): Promise<string | null> {
	try {
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
					const locale = session.user?.locale || 'et';
					const path = `/${locale}/${board.user.username}/${board.alias}`;
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
				const locale = session.user?.locale || 'et';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
			}
		}

		return null;
	} catch (error) {
		console.error('[getTopBoardPath] Error:', error);
		return null;
	}
}
