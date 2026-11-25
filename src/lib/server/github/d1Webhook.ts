/** @file src/lib/server/github/d1Webhook.ts */
// The webhook's reads and writes on D1 (#263). Boards are found by `github_repo = ?`, cards
// and comments by their indexed GitHub ids. Every write goes through `written()`, so the
// card's board gets its `changed_at` stamp and the 30 s poll sees the change.
import { and, asc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { D1 } from '$lib/server/db';
import {
	activity_logs,
	boards,
	comments,
	lists,
	notifications,
	todos,
	user_secrets
} from '$lib/server/db/schema';
import { RUNNER_STATUS } from '$lib/server/cardThread';
import { written } from '$lib/server/ops/d1/cardAccess';
import { iso } from '$lib/server/ops/d1/sql';
import type { Ctx } from '$lib/server/ops/op';
import { bellsFor, now, type Change, type WebhookCard, type WebhookDb } from './webhookDb';

const cardColumns = {
	id: true,
	title: true,
	content: true,
	completed_at: true,
	priority: true,
	list_id: true,
	github_issue_number: true
} as const;

async function cardWhere(d1: D1, where: SQL) {
	const row = await d1.query.todos.findFirst({
		where,
		columns: cardColumns,
		with: {
			assignees: { columns: { user_id: true } },
			list: { columns: { board_id: true }, with: { board: { columns: { user_id: true } } } }
		}
	});
	if (!row) return null;
	const { assignees, list, ...card } = row;
	return {
		...card,
		assignees: assignees.map((a) => a.user_id),
		boardId: list?.board_id ?? null,
		ownerId: list?.board?.user_id ?? null
	} satisfies WebhookCard;
}

/** Card ids on a board linked to `repo`: the commit and task-file lookups. */
const onRepo = (d1: D1, repo: string, where: SQL) =>
	d1
		.select({ id: todos.id })
		.from(todos)
		.innerJoin(lists, eq(lists.id, todos.list_id))
		.innerJoin(boards, eq(boards.id, lists.board_id))
		.where(and(eq(boards.github_repo, repo), where))
		.limit(1);

const listsOf = (d1: D1, boardId: string) =>
	d1
		.select({ id: lists.id, name: lists.name })
		.from(lists)
		.where(eq(lists.board_id, boardId))
		.orderBy(asc(lists.sort_order));

function commentWrite(d1: D1, todoId: string, c: NonNullable<Change['comment']>) {
	if ('add' in c) return d1.insert(comments).values({ ...c.add, todo_id: todoId });
	if ('edit' in c)
		return d1
			.update(comments)
			.set({ ...c.set, updated_at: now() })
			.where(eq(comments.id, c.edit));
	return d1.delete(comments).where(eq(comments.id, c.remove));
}

export function d1Webhook(ctx: Ctx & { d1: D1 }): WebhookDb {
	const { d1 } = ctx;
	return {
		cardByIssue: (issueId) => cardWhere(d1, eq(todos.github_issue_id, issueId)),
		async cardByNumber(repo, issueNumber) {
			const [hit] = await onRepo(d1, repo, eq(todos.github_issue_number, issueNumber));
			return hit ? cardWhere(d1, eq(todos.id, hit.id)) : null;
		},
		async cardWithLists(id) {
			const card = await cardWhere(d1, eq(todos.id, id));
			if (!card) return null;
			return { ...card, lists: card.boardId ? await listsOf(d1, card.boardId) : null };
		},
		async cardIdByTaskFile(repo, path) {
			const [hit] = await onRepo(d1, repo, eq(todos.task_file_path, path));
			return hit?.id ?? null;
		},
		async boardByRepo(repo) {
			const [board] = await d1
				.select({ id: boards.id, user_id: boards.user_id })
				.from(boards)
				.where(eq(boards.github_repo, repo))
				.limit(1);
			return board ? { ...board, lists: await listsOf(d1, board.id) } : null;
		},
		async userByLogin(login) {
			const [hit] = await d1
				.select({ id: user_secrets.user_id })
				.from(user_secrets)
				.where(
					and(
						eq(user_secrets.name, 'github'),
						sql`json_extract(${user_secrets.value}, '$.username') = ${login}`
					)
				)
				.limit(1);
			return hit?.id ?? null;
		},
		async commentByGithubId(id) {
			const [hit] = await d1
				.select({ id: comments.id, content: comments.content, user_id: comments.user_id })
				.from(comments)
				.where(eq(comments.github_comment_id, id))
				.limit(1);
			return hit ?? null;
		},
		async twin(todoId, body) {
			const [hit] = await d1
				.select({ id: comments.id })
				.from(comments)
				.where(
					and(
						eq(comments.todo_id, todoId),
						isNull(comments.github_comment_id),
						eq(comments.content, body)
					)
				)
				.limit(1);
			return hit?.id ?? null;
		},
		async ranByRunner(todoId) {
			// No regex in SQLite: the status line sits in a comment's first few characters.
			const heads = await d1
				.select({ head: sql<string>`substr(${comments.content}, 1, 40)` })
				.from(comments)
				.where(eq(comments.todo_id, todoId));
			return heads.some(({ head }) => RUNNER_STATUS.test(head));
		},
		async commitLogged(todoId, sha) {
			const [hit] = await d1
				.select({ id: activity_logs.id })
				.from(activity_logs)
				.where(
					and(
						eq(activity_logs.todo_id, todoId),
						eq(activity_logs.action_type, 'github_commit'),
						sql`json_extract(${activity_logs.changes}, '$.commit_sha') = ${sha}`
					)
				)
				.limit(1);
			return !!hit;
		},
		async save(card, { set, comment, log, notify }) {
			const writes: BatchItem<'sqlite'>[] = [];
			if (set) {
				const { completed_at, ...rest } = set;
				const values = {
					...rest,
					...(completed_at !== undefined && { completed_at: completed_at && iso(completed_at) }),
					updated_at: now()
				};
				writes.push(d1.update(todos).set(values).where(eq(todos.id, card.id)));
			}
			if (comment) writes.push(commentWrite(d1, card.id, comment));
			// Bells by hand, not `written`'s: a GitHub user with no app account triggers them
			// as nobody, so the board owner, who is the comment's author then, still gets one.
			const bells = notify
				? bellsFor(card, notify.by).map((user_id) => ({
						id: crypto.randomUUID(),
						user_id,
						todo_id: card.id,
						type: notify.type,
						content: notify.content,
						related_comment_id: notify.related_comment_id ?? null,
						triggered_by_user_id: notify.by,
						is_read: false
					}))
				: [];
			if (bells.length) writes.push(d1.insert(notifications).values(bells));
			if (!writes.length && !log) return;
			const logs = log ? [{ ...log, todo_id: card.id }] : [];
			await written({ ...ctx, d1, userId: log?.by ?? '' }, writes, [card.boardId], { logs });
		}
	};
}
