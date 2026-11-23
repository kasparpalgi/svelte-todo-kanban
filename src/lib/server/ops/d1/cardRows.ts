/** @file src/lib/server/ops/d1/cardRows.ts */
// Cards in the shape of Hasura's TodoFields / TodoDetailFields, read with one statement:
// the relations become correlated JSON sub-selects (#232 measured ~4k rows read on tekdok
// that way, against ~11k with one query per child table). `assigned_to` is no column in
// D1: it is the oldest assignee (#256).
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql, type SQL } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import {
	claude_usage,
	comments,
	labels,
	lists,
	todo_assignees,
	todos
} from '$lib/server/db/schema';
import { prepared } from './sql';

const person = {
	columns: { id: true, name: true, username: true, image: true, email: true }
} as const;

const columns = {
	id: true,
	alias: true,
	title: true,
	due_on: true,
	has_time: true,
	sort_order: true,
	priority: true,
	list_id: true,
	completed_at: true,
	created_at: true,
	updated_at: true,
	github_issue_number: true,
	github_issue_id: true,
	github_synced_at: true,
	github_url: true,
	task_file_path: true,
	agent_model: true,
	agent_effort: true,
	agent_machine: true,
	agent_plan_first: true,
	min_hours: true,
	max_hours: true,
	actual_hours: true,
	comment_hours: true
} as const;

/** The primary assignee is the first one added. A callback: nested tables are aliased. */
export const oldest = (t: typeof todo_assignees._.columns) => [asc(t.created_at), asc(t.user_id)];

const cardId = sql.raw('"todos"."id"');

const shape = {
	// Drizzle writes root extras' columns unqualified, which inside a sub-select would mean
	// the inner table's `id`; the root keeps its name as alias, so spell it out.
	extras: {
		content_preview: sql<string | null>`substr(${todos.content}, 1, 150)`.as('content_preview'),
		// Rounded: Postgres sums numeric exactly, SQLite sums doubles.
		cost_usd: sql<
			number | null
		>`(select round(sum(${claude_usage.cost_usd}), 10) from ${claude_usage}
			where ${claude_usage.todo_id} = ${cardId})`.as('cost_usd'),
		comment_count: sql<number>`(select count(*) from ${comments}
			where ${comments.todo_id} = ${cardId})`.as('comment_count')
	},
	with: {
		assignees: {
			columns: { user_id: true, created_at: true },
			orderBy: oldest,
			with: { assignee: person }
		},
		subscribers: { columns: { user_id: true, created_at: true }, with: { subscriber: person } },
		labels: {
			columns: { label_id: true },
			with: {
				label: {
					columns: {
						id: true,
						name: true,
						color: true,
						sort_order: true,
						board_id: true,
						created_at: true,
						updated_at: true
					}
				}
			}
		},
		uploads: { columns: { id: true, url: true, created_at: true } },
		list: {
			columns: { id: true, name: true, sort_order: true },
			with: { board: { columns: { id: true } } }
		}
	}
} as const;

type Person = { id: string; name: string | null; username: string; image: string | null };
type Label = typeof labels.$inferSelect;
type Row = {
	cost_usd: number | null;
	comment_count: number;
	assignees: { user_id: string; assignee: Person }[];
	labels: { label: Label }[];
};

function card<R extends Row>({ cost_usd, comment_count, labels, ...row }: R) {
	const primary = row.assignees[0] as Row['assignees'][number] | undefined;
	return {
		...row,
		assigned_to: primary?.user_id ?? null,
		assignee: primary?.assignee ?? null,
		labels: labels.map(({ label }) => ({ label })),
		claude_usages_aggregate: { aggregate: { sum: { cost_usd } } },
		comments_aggregate: { aggregate: { count: comment_count } }
	};
}

type Page = { orderBy?: SQL[]; limit?: number; offset?: number };

/** Board cards, without bodies (#211). */
export async function cardRows(d1: D1, where: SQL | undefined, page: Page = {}) {
	const rows = await d1.query.todos.findMany({ ...shape, columns, where, ...page });
	return rows.map(card);
}

/** Open cards by sort order, done ones newest first. Postgres sorts nulls as the biggest
 * value, SQLite as the smallest, hence `desc nulls first`. `id` last: cards updated
 * together tie on everything else (#256). */
export const cardOrder = (completed: boolean) =>
	completed
		? [desc(todos.completed_at), asc(todos.id)]
		: [
				sql`${todos.sort_order}`,
				sql`${todos.due_on} desc nulls first`,
				desc(todos.updated_at),
				asc(todos.id)
			];

const onBoard = (completed: boolean) =>
	prepared((d1) =>
		d1.query.todos
			.findMany({
				...shape,
				columns,
				where: and(
					completed ? isNotNull(todos.completed_at) : isNull(todos.completed_at),
					inArray(
						todos.list_id,
						d1
							.select({ id: lists.id })
							.from(lists)
							.where(eq(lists.board_id, sql.placeholder('boardId')))
					)
				),
				orderBy: cardOrder(completed),
				limit: sql.placeholder('limit'),
				offset: sql.placeholder('offset')
			})
			.prepare()
	);
const openOnBoard = onBoard(false);
const doneOnBoard = onBoard(true);

type BoardPage = { boardId: string; completed: boolean; limit: number; offset: number };

/** One board's open or done cards, a page of them. */
export async function boardCards(d1: D1, { completed, ...page }: BoardPage) {
	const rows = await (completed ? doneOnBoard : openOnBoard)(d1).execute(page);
	return rows.map(card);
}

const detail = prepared((d1) =>
	d1.query.todos
		.findFirst({
			...shape,
			columns: { ...columns, content: true },
			where: eq(todos.id, sql.placeholder('id'))
		})
		.prepare()
);

/** One card with its body, or null when it is gone. */
export async function cardDetail(d1: D1, id: string) {
	const row = await detail(d1).execute({ id });
	return row ? card(row) : null;
}
