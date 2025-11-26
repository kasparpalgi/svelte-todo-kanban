/** @file src/routes/[lang]/[username]/[board]/expenses/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS, GET_BOARD_MEMBERS } from '$lib/graphql/documents';
import type { GetBoardsQuery, GetBoardMembersQuery } from '$lib/graphql/generated/graphql';

export const load: PageServerLoad = async ({ locals, params, fetch }) => {
	const session = await locals.auth();

	if (!session) {
		throw redirect(302, '/signin');
	}

	const { username, board: boardAlias } = params;

	try {
		// Fetch board data
		const boardsData = await request<GetBoardsQuery>(
			GET_BOARDS,
			{
				where: { alias: { _eq: boardAlias } }
			},
			{},
			fetch
		);

		const board = boardsData.boards?.[0];

		if (!board) {
			throw redirect(302, `/${params.lang}/${username}`);
		}

		// Fetch board members
		const membersData = await request<GetBoardMembersQuery>(
			GET_BOARD_MEMBERS,
			{
				where: { board_id: { _eq: board.id } }
			},
			{},
			fetch
		);

		// Add the board owner to members if not already included
		const boardOwner = board.user;
		const ownerInMembers = membersData.board_members?.some(
			(m) => m.user_id === boardOwner?.id
		);
		const allMembers = ownerInMembers
			? membersData.board_members || []
			: [
					...(membersData.board_members || []),
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
