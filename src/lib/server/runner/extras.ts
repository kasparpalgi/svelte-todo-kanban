/** @file src/lib/server/runner/extras.ts */
// The runner's comments, attachments and Claude bookkeeping (#231).
import { z } from 'zod';
import {
	RUNNER_COMMENTS,
	RUNNER_CREATE_COMMENT,
	RUNNER_PRICING,
	RUNNER_UPDATE_COMMENT,
	RUNNER_UPLOADS,
	RUNNER_UPSERT_PRICING,
	RUNNER_UPSERT_USAGE
} from '$lib/graphql/documents';
import { defineOp, OpError } from '$lib/server/ops/op';

const id = z.guid();
const body = z.string().min(1).max(200_000);
const money = z.number().nonnegative();
const count = z.number().int().nonnegative();
const time = z.string().max(40);

/** A card's comments, newest first; narrowed to one author and/or one exact body. */
export const comments = defineOp({
	auth: 'public',
	input: z.object({ todoId: id, userId: id.optional(), content: body.optional() }),
	async run(ctx, { todoId, userId, content }) {
		const where = {
			todo_id: { _eq: todoId },
			...(userId && { user_id: { _eq: userId } }),
			...(content !== undefined && { content: { _eq: content } })
		};
		return (await ctx.db(RUNNER_COMMENTS, { where })).comments;
	}
});

export const createComment = defineOp({
	auth: 'public',
	input: z.object({ todoId: id, userId: id, content: body }),
	async run(ctx, { todoId, userId, content }) {
		const o = { todo_id: todoId, user_id: userId, content };
		const data = await ctx.db(RUNNER_CREATE_COMMENT, { o });
		if (!data.insert_comments_one) throw new Error('insert_comments_one returned no row');
		return data.insert_comments_one;
	}
});

export const updateComment = defineOp({
	auth: 'public',
	input: z.object({ id, content: body }),
	async run(ctx, input) {
		const data = await ctx.db(RUNNER_UPDATE_COMMENT, input);
		if (!data.update_comments_by_pk) throw new OpError(404, 'Comment not found');
		return data.update_comments_by_pk;
	}
});

export const uploads = defineOp({
	auth: 'public',
	input: z.object({ todoId: id }),
	async run(ctx, { todoId }) {
		return (await ctx.db(RUNNER_UPLOADS, { todoId })).uploads;
	}
});

export const pricing = defineOp({
	auth: 'public',
	input: z.object({}),
	async run(ctx) {
		return (await ctx.db(RUNNER_PRICING, {})).claude_model_pricing;
	}
});

const priceRow = z.object({
	model: z.string().min(1).max(200),
	input_per_mtok: money,
	output_per_mtok: money,
	cache_write_per_mtok: money,
	cache_read_per_mtok: money,
	currency: z.string().max(10).optional(),
	source: z.string().max(500).optional()
});

/** Upsert prices keyed on `model`. */
export const upsertPricing = defineOp({
	auth: 'public',
	input: z.object({ rows: z.array(priceRow).max(500) }),
	async run(ctx, { rows }) {
		const updated_at = new Date().toISOString();
		const data = await ctx.db(RUNNER_UPSERT_PRICING, {
			rows: rows.map((r) => ({ ...r, updated_at }))
		});
		return { affected: data.insert_claude_model_pricing?.affected_rows ?? 0 };
	}
});

/** One `claude_usage` row per session; re-sending the same session refreshes it. */
export const recordUsage = defineOp({
	auth: 'public',
	input: z.object({
		row: z.object({
			session_id: z.string().min(1).max(200),
			todo_id: id.nullable(),
			user_id: id,
			repo: z.string().max(200),
			model: z.string().max(200),
			input_tokens: count,
			output_tokens: count,
			cache_read_tokens: count,
			cache_write_tokens: count,
			usage_by_model: z.record(z.string(), z.unknown()),
			cost_usd: money,
			started_at: time.nullable(),
			ended_at: time.nullable()
		})
	}),
	async run(ctx, { row }) {
		const data = await ctx.db(RUNNER_UPSERT_USAGE, { row });
		if (!data.insert_claude_usage_one) throw new Error('insert_claude_usage_one returned no row');
		return data.insert_claude_usage_one;
	}
});
