/** @file src/lib/utils/getTopBoardPath.ts */
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

export async function getTopBoardPath(
	session: any,
	fetch: typeof globalThis.fetch
): Promise<string | null> {
	try {
		console.log('[getTopBoardPath] Session:', { id: session?.user?.id, email: session?.user?.email });
		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;
		console.log('[getTopBoardPath] Last board alias:', lastBoardAlias);

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

			console.log('[getTopBoardPath] Query by alias result:', dataByAlias);
			if (dataByAlias.boards && dataByAlias.boards.length > 0) {
				const board = dataByAlias.boards[0];
				console.log('[getTopBoardPath] Found board by alias:', { alias: board.alias, username: board.user?.username });

				if (board.user?.username && board.alias) {
					const locale = session.user?.locale || 'et';
					const path = `/${locale}/${board.user.username}/${board.alias}`;
					console.log('[getTopBoardPath] ✓ Returning path:', path);
					return path;
				}
			}
		}

		console.log('[getTopBoardPath] Querying top board...');
		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			undefined,
			fetch
		);

		console.log('[getTopBoardPath] Top board query result:', data);
		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			console.log('[getTopBoardPath] Top board:', { alias: board.alias, username: board.user?.username });

			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'et';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
				console.log('[getTopBoardPath] ✓ Returning path:', path);
				return path;
			}
		}

		console.log('[getTopBoardPath] ✗ No valid board found');
		return null;
	} catch (error) {
		console.error('[getTopBoardPath] Error:', error);
		return null;
	}
}
