/** @file src/lib/server/github/importCards.ts */
// The cards `import-issues` makes from a repo's open issues (#264), on either backend.
import { eq } from 'drizzle-orm';
import { CREATE_TODO } from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import type { D1 } from '$lib/server/db';
import { aliasBase, nextFree } from '$lib/server/db/rules';
import { todos } from '$lib/server/db/schema';
import { requireEditableList as requireListOnD1, written } from '$lib/server/ops/d1/cardAccess';
import { iso } from '$lib/server/ops/d1/sql';
import { requireEditableList } from '$lib/server/ops/cardAccess';
import type { UserCtx } from '$lib/server/ops/op';

type D1Ctx = UserCtx & { d1: D1 };

export type IssueCard = {
	title: string;
	content: string | null;
	list_id: string;
	user_id: string;
	github_issue_number: number;
	github_issue_id: number;
	github_url: string;
	github_synced_at: string;
	sort_order: number;
	priority: 'low' | 'medium' | 'high';
	completed_at: string | null;
	due_on: string | null;
};

/** The board a list is on, once the caller may edit it. */
export async function editableListBoard(ctx: UserCtx, listId: string): Promise<string> {
	const list = ctx.d1
		? await requireListOnD1(ctx as D1Ctx, listId)
		: await requireEditableList(ctx, listId);
	return list.board_id;
}

/** Inserts the cards; returns how many were made. */
export async function insertIssueCards(ctx: UserCtx, boardId: string, cards: IssueCard[]) {
	if (!cards.length) return 0;
	if (!ctx.d1) {
		const result = await serverRequest(CREATE_TODO, { objects: cards });
		return result.insert_todos?.returning?.length || 0;
	}
	const { d1 } = ctx;
	// The aliases are unique per user, and a bulk insert has no trigger to pick them (#256).
	const taken = new Set(
		(await d1.select({ alias: todos.alias }).from(todos).where(eq(todos.user_id, ctx.userId))).map(
			(r) => r.alias
		)
	);
	const rows = cards.map((card) => {
		const alias = nextFree(aliasBase(card.title, 'todo'), taken);
		taken.add(alias);
		return {
			...card,
			id: crypto.randomUUID(),
			alias,
			completed_at: card.completed_at && iso(card.completed_at),
			due_on: card.due_on && iso(card.due_on),
			has_time: false,
			agent_plan_first: false
		};
	});
	// D1 binds at most 100 parameters a statement: a few cards each, all in one batch.
	const writes = [];
	for (let i = 0; i < rows.length; i += 5) {
		writes.push(d1.insert(todos).values(rows.slice(i, i + 5)));
	}
	await written(ctx as D1Ctx, writes, [boardId]);
	return rows.length;
}
