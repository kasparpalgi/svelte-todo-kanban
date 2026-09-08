/** @file src/routes/[lang]/[username]/[board]/invoices/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS, GET_LISTS } from '$lib/graphql/documents';
import type { GetBoardsQuery, GetListsQuery } from '$lib/graphql/generated/graphql';

export const load: PageServerLoad = async ({ locals, params, fetch }) => {
	const session = await locals.auth();

	if (!session) {
		throw redirect(302, '/signin');
	}

	const { username, board: boardAlias } = params;

	try {
		const boardsData = await request<GetBoardsQuery>(
			GET_BOARDS,
			{ where: { alias: { _eq: boardAlias } } },
			{},
			fetch
		);

		const board = boardsData.boards?.[0];
		if (!board) throw redirect(302, `/${params.lang}/${username}`);

		const listsData = await request<GetListsQuery>(
			GET_LISTS,
			{ where: { board_id: { _eq: board.id } } },
			{},
			fetch
		);

		return {
			session,
			board,
			lists: listsData.lists || []
		};
	} catch (error) {
		if (error instanceof Response) throw error;
		console.error('Failed to load invoices page:', error);
		throw redirect(302, `/${params.lang}/${username}`);
	}
};
