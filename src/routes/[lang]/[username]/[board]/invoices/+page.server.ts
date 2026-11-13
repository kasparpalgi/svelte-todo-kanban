/** @file src/routes/[lang]/[username]/[board]/invoices/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverRequest } from '$lib/graphql/server-client';
import { getBoard } from '$lib/server/ops/boards';
import { getLists } from '$lib/server/ops/lists';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw redirect(302, '/signin');

	const back = `/${params.lang}/${params.username}`;
	const ctx = { userId: session.user.id, db: serverRequest };
	const board = await getBoard.run(ctx, { alias: params.board }).catch((error) => {
		console.error('Failed to load invoices page:', error);
		return null;
	});
	if (!board) throw redirect(302, back);

	const lists = (await getLists.run(ctx, { boardId: board.id })).filter(
		(list) => list.board_id === board.id
	);
	return { session, board, lists };
};
