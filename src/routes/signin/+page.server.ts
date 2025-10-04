/** @file src/routes/signin/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

async function getTopBoardPath(session: any): Promise<string | null> {
	try {
		console.log('=== SIGNIN: GETTING TOP BOARD ===');
		console.log('Session user:', session?.user);

		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			session
		);

		console.log('Boards query result:', data);
		console.log('Boards count:', data.boards?.length);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			console.log('Top board:', board);

			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'en';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
				console.log('✓ Redirecting to top board:', path);
				return path;
			} else {
				console.warn('✗ Top board missing username or alias:', {
					username: board.user?.username,
					alias: board.alias
				});
			}
		} else {
			console.log('✗ No boards found');
		}

		return null;
	} catch (error) {
		console.error('✗ Error getting top board:', error);
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
