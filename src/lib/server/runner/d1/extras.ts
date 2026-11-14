/** @file src/lib/server/runner/d1/extras.ts */
// The runner's comments, attachments and Claude bookkeeping on D1 (#247).
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import {
	claude_model_pricing as prices,
	claude_usage,
	comments as commentTable,
	todos,
	uploads as uploadTable
} from '$lib/server/db/schema';
import { OpError } from '$lib/server/ops/op';
import { inChunks, iso } from '$lib/server/ops/d1/sql';
import type { RunnerD1Run } from './types';

/** An upsert's `set`: each column takes the row that conflicted, as Hasura's `update_columns`. */
const excluded = (columns: string[]) =>
	Object.fromEntries(columns.map((c) => [c, sql.raw(`excluded.${c}`)]));

export const comments: RunnerD1Run<'comments'> = async ({ d1 }, { todoId, userId, content }) => {
	const c = commentTable;
	return d1
		.select({ id: c.id, content: c.content })
		.from(c)
		.where(
			and(
				eq(c.todo_id, todoId),
				userId ? eq(c.user_id, userId) : undefined,
				content !== undefined ? eq(c.content, content) : undefined
			)
		)
		.orderBy(desc(c.created_at));
};

export const createComment: RunnerD1Run<'createComment'> = async ({ d1 }, input) => {
	const id = crypto.randomUUID();
	await d1
		.insert(commentTable)
		.values({ id, todo_id: input.todoId, user_id: input.userId, content: input.content });
	return { id };
};

export const updateComment: RunnerD1Run<'updateComment'> = async ({ d1 }, { id, content }) => {
	const [row] = await d1
		.update(commentTable)
		.set({ content, updated_at: new Date().toISOString() })
		.where(eq(commentTable.id, id))
		.returning({ id: commentTable.id });
	if (!row) throw new OpError(404, 'Comment not found');
	return row;
};

export const uploads: RunnerD1Run<'uploads'> = async ({ d1 }, { todoId }) =>
	d1
		.select({ url: uploadTable.url })
		.from(uploadTable)
		.where(eq(uploadTable.todo_id, todoId))
		.orderBy(asc(uploadTable.created_at));

export const pricing: RunnerD1Run<'pricing'> = async ({ d1 }) =>
	d1
		.select({
			model: prices.model,
			input_per_mtok: prices.input_per_mtok,
			output_per_mtok: prices.output_per_mtok,
			cache_read_per_mtok: prices.cache_read_per_mtok,
			cache_write_per_mtok: prices.cache_write_per_mtok
		})
		.from(prices)
		.orderBy(asc(prices.model));

export const upsertPricing: RunnerD1Run<'upsertPricing'> = async ({ d1 }, { rows }) => {
	if (!rows.length) return { affected: 0 };
	const updated_at = new Date().toISOString();
	// Every column spelled out, so each row binds the same 8 parameters `inChunks` counts.
	const values = rows.map((r) => ({
		...r,
		currency: r.currency ?? 'USD',
		source: r.source ?? null,
		updated_at
	}));
	const set = excluded([
		'input_per_mtok',
		'output_per_mtok',
		'cache_write_per_mtok',
		'cache_read_per_mtok',
		'currency',
		'source',
		'updated_at'
	]);
	await d1.batch(
		inChunks(values, (chunk) =>
			d1.insert(prices).values(chunk).onConflictDoUpdate({ target: prices.model, set })
		)
	);
	// Each row is inserted or updated, which is what Hasura's affected_rows counted.
	return { affected: rows.length };
};

export const recordUsage: RunnerD1Run<'recordUsage'> = async ({ d1 }, { row }) => {
	const values = {
		...row,
		started_at: row.started_at && iso(row.started_at),
		ended_at: row.ended_at && iso(row.ended_at)
	};
	const set = excluded([
		'todo_id',
		'user_id',
		'repo',
		'model',
		'input_tokens',
		'output_tokens',
		'cache_read_tokens',
		'cache_write_tokens',
		'usage_by_model',
		'cost_usd',
		'started_at',
		'ended_at'
	]);
	const [saved] = await d1
		.insert(claude_usage)
		.values(values)
		.onConflictDoUpdate({ target: claude_usage.session_id, set })
		.returning({ id: claude_usage.id });
	if (!saved) throw new Error('claude_usage upsert returned no row');
	return saved;
};

export const usage: RunnerD1Run<'usage'> = async ({ d1 }, { since }) => {
	const u = claude_usage;
	const rows = await d1
		.select({
			todo_id: u.todo_id,
			model: u.model,
			output_tokens: u.output_tokens,
			cost_usd: u.cost_usd,
			started_at: u.started_at,
			ended_at: u.ended_at,
			agent_effort: todos.agent_effort,
			card: todos.id
		})
		.from(u)
		.leftJoin(todos, eq(todos.id, u.todo_id))
		.where(gte(u.started_at, iso(since)))
		.orderBy(asc(u.started_at), asc(u.id));
	return rows.map(({ agent_effort, card, ...row }) => ({
		...row,
		todo: card === null ? null : { agent_effort }
	}));
};
