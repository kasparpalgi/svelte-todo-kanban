/** @file src/routes/[lang]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

async function getTopBoardPath(
	session: any,
	fetch: typeof globalThis.fetch
): Promise<string | null> {
	try {
		console.log('[Lang Layout] === GETTING TOP BOARD ===');
		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;

		if (lastBoardAlias) {
			const dataByAlias: GetBoardsQuery = await request(
				GET_BOARDS,
				{
					where: { alias: { _eq: lastBoardAlias } },
					limit: 1
				},
				session,
				fetch
			);

			if (dataByAlias.boards && dataByAlias.boards.length > 0) {
				const board = dataByAlias.boards[0];
				if (board.user?.username && board.alias) {
					const locale = session.user?.locale || 'en';
					return `/${locale}/${board.user.username}/${board.alias}`;
				}
			}
		}

		// Fallback: Get the top board by sort order
		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			session,
			fetch // Pass fetch here
		);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'en';
				return `/${locale}/${board.user.username}/${board.alias}`;
			}
		}

		return null;
	} catch (error) {
		console.error('[Lang Layout] ✗ Error getting top board:', error);
		return null;
	}
}

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals, fetch } = event; // Get fetch from event

	const session = await locals.auth();

	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		throw redirect(302, `/signin`);
	}

	const pathSegments = url.pathname.split('/').filter(Boolean);
	const isLanguageRootOnly = pathSegments.length === 1 && pathSegments[0] === params.lang;

	if (session && isLanguageRootOnly) {
		const topBoardPath = await getTopBoardPath(session, fetch); // Pass fetch
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		}
	}

	return {
		session
	};
};
