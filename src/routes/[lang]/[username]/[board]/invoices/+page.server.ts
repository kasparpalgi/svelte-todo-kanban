/** @file src/routes/[lang]/[username]/[board]/invoices/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { callOp, opCtx } from '$lib/server/ops/run';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const session = await locals.auth();
	if (!session?.user?.id) throw redirect(302, '/signin');

	const back = `/${params.lang}/${params.username}`;
	const ctx = opCtx(session.user.id, platform);
	const board = await callOp('getBoard', ctx, { alias: params.board }).catch((error) => {
		console.error('Failed to load invoices page:', error);
		return null;
	});
	if (!board) throw redirect(302, back);

	const lists = (await callOp('getLists', ctx, { boardId: board.id })).filter(
		(list) => list.board_id === board.id
	);
	return { session, board, lists };
};
