/** @file src/lib/server/runner/attach.ts */
// The card lookup and the `uploads` row behind /api/runner/upload, on the backend the ctx
// names: Hasura, or D1 with DATA_BACKEND=d1 (#247).
import { and, eq } from 'drizzle-orm';
import { serverRequest } from '$lib/graphql/server-client';
import { boards, lists, todos, uploads, user_secrets } from '$lib/server/db/schema';
import type { Ctx } from '$lib/server/ops/op';
import { getPlanContext } from '$lib/server/plan';

type Settings = Record<string, unknown> | null;

/** The card's board owner and the settings that hold their R2 token; null when no such card. */
export async function cardOwner(ctx: Ctx, todoId: string) {
	if (ctx.d1) {
		const [row] = await ctx.d1
			.select({ owner: boards.user_id, r2: user_secrets.value })
			.from(todos)
			.innerJoin(lists, eq(lists.id, todos.list_id))
			.innerJoin(boards, eq(boards.id, lists.board_id))
			.leftJoin(
				user_secrets,
				and(eq(user_secrets.user_id, boards.user_id), eq(user_secrets.name, 'r2'))
			)
			.where(eq(todos.id, todoId));
		// D1 keeps the tokens in user_secrets; getR2Credentials reads `settings.tokens.r2`.
		const settings: Settings = row?.r2 ? { tokens: { r2: row.r2 } } : null;
		return row ? { owner: row.owner, settings } : null;
	}
	const { todos_by_pk: todo } = await serverRequest<
		{ todos_by_pk: { list: { board: { user_id: string } } | null } | null },
		{ id: string }
	>(`query RunnerTodo($id: uuid!) { todos_by_pk(id: $id) { list { board { user_id } } } }`, {
		id: todoId
	});
	const owner = todo?.list?.board.user_id;
	if (!owner) return null;
	const settings: Settings = (await getPlanContext(owner))?.settings ?? null;
	return { owner, settings };
}

export async function addUpload(ctx: Ctx, todoId: string, url: string) {
	if (ctx.d1) {
		await ctx.d1.insert(uploads).values({ id: crypto.randomUUID(), todo_id: todoId, url });
		return;
	}
	await serverRequest(
		`mutation RunnerUpload($o: uploads_insert_input!) { insert_uploads_one(object: $o) { id } }`,
		{ o: { todo_id: todoId, url } }
	);
}
