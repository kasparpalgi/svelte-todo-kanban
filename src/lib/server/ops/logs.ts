/** @file src/lib/server/ops/logs.ts */
import { z } from 'zod';
import { CREATE_LOGS, DELETE_OLD_LOGS, GET_LOGS } from '$lib/graphql/documents';
import { Order_By, type Logs_Bool_Exp } from '$lib/graphql/generated/graphql';
import { serverLog } from '$lib/server/log';
import { defineOp, type Db } from './op';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
// Prune on about 1 in 100 writes: no cron needed, and each delete stays small.
const PRUNE_CHANCE = 0.01;

// Cut, don't reject: a long stack trace must not cost the whole batch.
const text = (max: number) => z.string().transform((s) => s.slice(0, max));
const level = z.enum(['debug', 'info', 'warn', 'error']);
const isoDate = z.iso.datetime({ offset: true });

const logInput = z.object({
	timestamp: isoDate.optional(),
	level,
	component: text(100),
	message: text(2_000),
	data: text(20_000).nullish(),
	session_id: text(64).nullish(),
	user_agent: text(500).nullish(),
	url: text(2_000).nullish()
});

async function pruneOldLogs(db: Db) {
	try {
		await db(DELETE_OLD_LOGS, { before: new Date(Date.now() - RETENTION_MS).toISOString() });
	} catch (error) {
		serverLog.warn('ops/createLog', 'pruning old logs failed', String(error));
	}
}

/** Saves a batch of the signed-in user's client logs. */
export const createLog = defineOp({
	auth: 'user',
	input: z.object({ logs: z.array(logInput).min(1).max(50) }),
	async run({ db, userId }, { logs }) {
		await db(CREATE_LOGS, { logs: logs.map((log) => ({ ...log, user_id: userId })) });
		if (Math.random() < PRUNE_CHANCE) await pruneOldLogs(db);
		return { saved: logs.length };
	}
});

/** The signed-in user's own logs, newest first, in the shape GET_LOGS returns. */
export const getLogs = defineOp({
	auth: 'user',
	input: z.object({
		level: level.optional(),
		component: z.string().max(100).optional(),
		search: z.string().max(200).optional(),
		from: isoDate.optional(),
		to: isoDate.optional(),
		limit: z.number().int().min(1).max(200).default(50),
		offset: z.number().int().min(0).default(0)
	}),
	run({ db, userId }, { level, component, search, from, to, limit, offset }) {
		const where: Logs_Bool_Exp = { user_id: { _eq: userId } };
		if (level) where.level = { _eq: level };
		if (component) where.component = { _ilike: `%${component}%` };
		if (search) where.message = { _ilike: `%${search}%` };
		if (from || to) where.timestamp = { ...(from && { _gte: from }), ...(to && { _lte: to }) };
		// `id` breaks ties, so paging is stable and D1 returns the same rows (#233).
		const order_by = [{ timestamp: Order_By.Desc }, { id: Order_By.Desc }];
		return db(GET_LOGS, { where, order_by, limit, offset });
	}
});
