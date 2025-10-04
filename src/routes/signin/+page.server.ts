/** @file src/routes/signin/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

async function getTopBoardPath(session: any): Promise<string | null> {
	try {
		console.log('[Signin] === GETTING TOP BOARD ===');
		console.log('[Signin] Session user:', { id: session?.user?.id, email: session?.user?.email });
		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;
		console.log('[Signin] Last board alias from settings:', lastBoardAlias);

		if (lastBoardAlias) {
			const dataByAlias: GetBoardsQuery = await request(
				GET_BOARDS,
				{
					where: { alias: { _eq: lastBoardAlias } },
					limit: 1
				},
				session
			);

			console.log('[Signin] Board query by alias result:', dataByAlias);

			if (dataByAlias.boards && dataByAlias.boards.length > 0) {
				const board = dataByAlias.boards[0];
				console.log('[Signin] Found last opened board:', { alias: board.alias, username: board.user?.username });

				if (board.user?.username && board.alias) {
					const locale = session.user?.locale || 'en';
					const path = `/${locale}/${board.user.username}/${board.alias}`;
					console.log('[Signin] ✓ Redirecting to last opened board:', path);
					return path;
				}
			} else {
				console.log('[Signin] Last opened board not found, falling back to top board');
			}
		}

		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			session
		);

		console.log('[Signin] Boards query result:', data);
		console.log('[Signin] Boards count:', data.boards?.length);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			console.log('[Signin] Top board:', { alias: board.alias, username: board.user?.username });

			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'en';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
				console.log('[Signin] ✓ Redirecting to top board:', path);
				return path;
			} else {
				console.warn('[Signin] ✗ Top board missing username or alias:', {
					username: board.user?.username,
					alias: board.alias
				});
			}
		} else {
			console.log('[Signin] ✗ No boards found');
		}

		return null;
	} catch (error) {
		console.error('[Signin] ✗ Error getting top board:', error);
		return null;
	}
}

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();

	console.log('=== SIGNIN PAGE LOAD ===');
	console.log('Has session:', !!session);

	if (session) {
		const topBoardPath = await getTopBoardPath(session);
		if (topBoardPath) {
			console.log('→ Redirecting to top board:', topBoardPath);
			throw redirect(302, topBoardPath);
		} else {
			console.log('→ Redirecting to /en (no boards)');
			throw redirect(302, '/en');
		}
	}

	return {};
};
