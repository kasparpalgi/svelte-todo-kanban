/** @file src/lib/server/boardCard.ts */
// A board by its alias, and optionally one of its cards by alias, for the board page's
// OG tags and OG image. Runs the `getBoard` op's access check on the server, so the page
// load mints no Hasura JWT (#229). Card aliases are unique per user, so look in the board.
import { GET_TODOS } from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import { getBoard } from '$lib/server/ops/boards';

export async function boardAndCard(userId: string, boardAlias: string, cardAlias: string | null) {
	const board = await getBoard.run({ userId, db: serverRequest }, { alias: boardAlias });
	if (!board || !cardAlias) return { board, card: null };

	const data = await serverRequest(GET_TODOS, {
		where: { alias: { _eq: cardAlias }, list: { board_id: { _eq: board.id } } },
		limit: 1
	});
	return { board, card: data.todos[0] ?? null };
}
