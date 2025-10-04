/** @file src/routes/[lang]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

async function getTopBoardPath(session: any): Promise<string | null> {
	try {
		console.log('[Lang Layout] === GETTING TOP BOARD ===');
		console.log('[Lang Layout] Session user:', { id: session?.user?.id, email: session?.user?.email });

		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;
		console.log('[Lang Layout] Last board alias from settings:', lastBoardAlias);

		if (lastBoardAlias) {
			// Try to find the board with this alias
			const dataByAlias: GetBoardsQuery = await request(
				GET_BOARDS,
				{
					where: { alias: { _eq: lastBoardAlias } },
					limit: 1
				},
				session
			);

			console.log('[Lang Layout] Board query by alias result:', dataByAlias);

			if (dataByAlias.boards && dataByAlias.boards.length > 0) {
				const board = dataByAlias.boards[0];
				console.log('[Lang Layout] Found last opened board:', { alias: board.alias, username: board.user?.username });

				if (board.user?.username && board.alias) {
					const locale = session.user?.locale || 'en';
					const path = `/${locale}/${board.user.username}/${board.alias}`;
					console.log('[Lang Layout] ✓ Redirecting to last opened board:', path);
					return path;
				}
			} else {
				console.log('[Lang Layout] Last opened board not found, falling back to top board');
			}
		}

		// Fallback: Get the top board by sort order
		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			session
		);

		console.log('[Lang Layout] Boards query result:', data);
		console.log('[Lang Layout] Boards count:', data.boards?.length);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			console.log('[Lang Layout] Top board:', { alias: board.alias, username: board.user?.username });

			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'en';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
				console.log('[Lang Layout] ✓ Redirecting to top board:', path);
				return path;
			} else {
				console.warn('[Lang Layout] ✗ Top board missing username or alias:', { username: board.user?.username, alias: board.alias });
			}
		} else {
			console.log('[Lang Layout] ✗ No boards found');
		}

		return null;
	} catch (error) {
		console.error('[Lang Layout] ✗ Error getting top board:', error);
		return null;
	}
}

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals } = event;

	const session = await locals.auth();

	console.log('[Lang Layout] === LAYOUT SERVER LOAD ===');
	console.log('[Lang Layout] Path:', url.pathname);
	console.log('[Lang Layout] Has session:', !!session);
	console.log('[Lang Layout] Params:', params);

	// If user is not signed in, redirect to signin
	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		console.log('[Lang Layout] → Redirecting to /signin (no session)');
		throw redirect(302, `/signin`);
	}

	// If user IS signed in and accessing just /[lang] (like /en), redirect to top board
	if (session && params.lang && !url.pathname.split('/').filter(Boolean).slice(1).length) {
		console.log('[Lang Layout] → User accessing language root, redirecting to top board');
		const topBoardPath = await getTopBoardPath(session);
		if (topBoardPath) {
			console.log('[Lang Layout] → Redirecting to top board:', topBoardPath);
			throw redirect(302, topBoardPath);
		}
	}

	return {
		session
	};
};
