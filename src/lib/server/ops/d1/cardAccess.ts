/** @file src/lib/server/ops/d1/cardAccess.ts */
// The D1 side of ops/cardAccess.ts. `requireCard` is one statement and primes the board
// role; `written` is one `d1.batch()`: the write itself, the `changed_at` stamp, the
// activity rows and the notifications, so they commit or fail together (#256).
import { eq } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { D1Result } from '@cloudflare/workers-types';
import { canEdit, primeRole, requireRole, roleFrom, type BoardRole } from '$lib/server/access';
import type { D1 } from '$lib/server/db';
import { activity_logs, lists, notifications, todos } from '$lib/server/db/schema';
import type { Card } from '../cardAccess';
import type { ActivityRow } from '../cardActivity';
import { OpError, type UserCtx } from '../op';
import { cardDetail, oldest } from './cardRows';
import { stamp } from './lists';
import { inChunks } from './sql';

export type Ctx = UserCtx & { d1: D1 };

/** The card, its board and the caller's role there. 404 when gone, 403 unless `allowed`. */
export async function requireCard(
	ctx: Ctx,
	id: string,
	allowed: (role: BoardRole) => boolean
): Promise<{ card: Card; boardId: string | null; role: BoardRole }> {
	const row = await ctx.d1.query.todos.findFirst({
		where: eq(todos.id, id),
		columns: {
			id: true,
			user_id: true,
			list_id: true,
			title: true,
			content: true,
			completed_at: true,
			priority: true,
			due_on: true,
			has_time: true,
			min_hours: true,
			max_hours: true,
			actual_hours: true,
			comment_hours: true,
			task_file_path: true,
			github_issue_number: true,
			github_issue_id: true
		},
		with: {
			assignees: { columns: { user_id: true }, orderBy: oldest },
			subscribers: { columns: { user_id: true } },
			list: {
				columns: { name: true, board_id: true },
				with: {
					board: {
						columns: { user_id: true, is_public: true },
						with: {
							board_members: {
								columns: { role: true },
								where: (m, { eq }) => eq(m.user_id, ctx.userId)
							}
						}
					}
				}
			}
		}
	});
	if (!row) throw new OpError(404, 'Card not found');
	const card: Card = { ...row, assigned_to: row.assignees[0]?.user_id ?? null };

	const boardId = card.list?.board_id ?? null;
	// A card outside any list belongs to its creator alone.
	const role: BoardRole = boardId
		? roleFrom(card.list?.board, ctx.userId)
		: card.user_id === ctx.userId
			? 'owner'
			: null;
	if (boardId) primeRole(ctx, boardId, role);
	if (!allowed(role)) throw new OpError(403, 'Not allowed on this card');
	return { card, boardId, role };
}

/** A list's board and name. 403 unless the caller can edit that board. */
export async function requireEditableList(ctx: Ctx, listId: string) {
	const [list] = await ctx.d1
		.select({ board_id: lists.board_id, name: lists.name })
		.from(lists)
		.where(eq(lists.id, listId));
	if (!list?.board_id) throw new OpError(404, 'List not found');
	await requireRole(ctx, list.board_id, canEdit);
	return { ...list, board_id: list.board_id };
}

/** The card as the board shows it, with its body: what a card op hands back. */
export async function cardDetails(ctx: Ctx, id: string) {
	const todo = await cardDetail(ctx.d1, id);
	if (!todo) throw new OpError(404, 'Card not found');
	return todo;
}

type Notification = {
	user_id: string;
	todo_id: string;
	type: string;
	content: string;
	related_comment_id?: string;
};

type Effects = {
	logs?: (ActivityRow & { todo_id: string })[];
	notify?: Notification[];
};

/**
 * `writes`, then the boards' `changed_at` stamp (what the poll compares, #229), the activity
 * rows and the notifications (never to the caller), in one batch. Returns the writes' results.
 */
export async function written(
	ctx: Ctx,
	writes: BatchItem<'sqlite'>[],
	boardIds: (string | null | undefined)[],
	{ logs = [], notify = [] }: Effects = {}
) {
	const { d1, userId } = ctx;
	const items: BatchItem<'sqlite'>[] = [...writes];
	if (boardIds.some(Boolean)) items.push(stamp(d1, boardIds));
	// Every bound column spelled out, so each row binds the parameters `inChunks` counts.
	const rows = logs.map((log) => ({
		id: crypto.randomUUID(),
		user_id: userId,
		todo_id: log.todo_id,
		action_type: log.action_type,
		field_name: log.field_name ?? null,
		old_value: log.old_value ?? null,
		new_value: log.new_value ?? null,
		changes: log.changes ?? null
	}));
	if (rows.length) items.push(...inChunks(rows, (c) => d1.insert(activity_logs).values(c)));
	const sent = notify
		.filter((n) => n.user_id !== userId)
		.map((n) => ({
			id: crypto.randomUUID(),
			user_id: n.user_id,
			todo_id: n.todo_id,
			type: n.type,
			content: n.content,
			related_comment_id: n.related_comment_id ?? null,
			triggered_by_user_id: userId,
			is_read: false
		}));
	if (sent.length) items.push(...inChunks(sent, (c) => d1.insert(notifications).values(c)));
	const [first, ...rest] = items;
	return (await d1.batch([first, ...rest])) as D1Result[];
}

/** Rows changed by a batch item `written` returned: did the delete find its row? */
export const changed = (result: D1Result | undefined) => (result?.meta.changes ?? 0) > 0;
