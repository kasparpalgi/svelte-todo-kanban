/** @file src/routes/[lang]/[username]/[board]/expenses/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverRequest } from '$lib/graphql/server-client';
import { getBoard } from '$lib/server/ops/boards';
import { getBoardMembers } from '$lib/server/ops/members';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.auth();

	if (!session?.user?.id) {
		throw redirect(302, '/signin');
	}

	const { username, board: boardAlias } = params;

	try {
		const ctx = { userId: session.user.id, db: serverRequest };
		const board = await getBoard.run(ctx, { alias: boardAlias });
		if (!board) throw redirect(302, `/${params.lang}/${username}`);
		const members = await getBoardMembers.run(ctx, { boardId: board.id });

		// Add the board owner to members if not already included
		const boardOwner = board.user;
		const ownerInMembers = members.some(
			(m) => m.user_id === boardOwner?.id
		);
		const allMembers = ownerInMembers
			? members
			: [
					...members,
					{
						id: `owner-${board.id}`,
						board_id: board.id,
						user_id: boardOwner?.id || '',
						role: 'owner' as const,
						created_at: board.created_at || new Date().toISOString(),
						updated_at: board.updated_at || new Date().toISOString(),
						user: boardOwner
					}
				];

		return {
			session,
			board,
			boardMembers: allMembers
		};
	} catch (error) {
		console.error('Failed to load expenses page data:', error);
		throw redirect(302, `/${params.lang}/${username}`);
	}
};
