/** @file src/lib/server/ops/d1/logs.ts */
// createLog / getLogs on D1. One time column: `created_at` is the event time, clamped to
// now so the 30-day prune (`created_at < ?`, indexed) catches every row.
import { and, count, desc, eq, gte, lt, lte, type SQL } from 'drizzle-orm';
import { logs } from '$lib/server/db/schema';
import { serverLog } from '$lib/server/log';
import { inChunks, contains } from './sql';
import type { D1Run } from './types';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PRUNE_CHANCE = 0.01;

export const createLog: D1Run<'createLog'> = async ({ d1, userId }, { logs: batch }) => {
	const now = new Date().toISOString();
	const rows = batch.map((log) => ({
		id: crypto.randomUUID(),
		level: log.level,
		component: log.component,
		message: log.message,
		data: log.data ?? null,
		user_id: userId,
		session_id: log.session_id ?? null,
		user_agent: log.user_agent ?? null,
		url: log.url ?? null,
		created_at: eventTime(log.timestamp, now)
	}));
	await d1.batch(inChunks(rows, (chunk) => d1.insert(logs).values(chunk)));
	if (Math.random() < PRUNE_CHANCE) {
		const before = new Date(Date.now() - RETENTION_MS).toISOString();
		await d1
			.delete(logs)
			.where(lt(logs.created_at, before))
			.catch((error) => serverLog.warn('ops/createLog', 'pruning old logs failed', String(error)));
	}
	return { saved: batch.length };
};

/** The client's time as ISO UTC, but never later than now. */
function eventTime(timestamp: string | undefined, now: string) {
	if (!timestamp) return now;
	const iso = new Date(timestamp).toISOString();
	return iso < now ? iso : now;
}

export const getLogs: D1Run<'getLogs'> = async ({ d1, userId }, input) => {
	const { level, component, search, from, to, limit, offset } = input;
	const where: (SQL | undefined)[] = [eq(logs.user_id, userId)];
	if (level) where.push(eq(logs.level, level));
	if (component) where.push(contains(logs.component, component));
	if (search) where.push(contains(logs.message, search));
	if (from) where.push(gte(logs.created_at, new Date(from).toISOString()));
	if (to) where.push(lte(logs.created_at, new Date(to).toISOString()));
	const filter = and(...where);

	const [rows, [total]] = await d1.batch([
		d1
			.select({
				id: logs.id,
				level: logs.level,
				component: logs.component,
				message: logs.message,
				data: logs.data,
				user_id: logs.user_id,
				session_id: logs.session_id,
				url: logs.url,
				created_at: logs.created_at
			})
			.from(logs)
			.where(filter)
			.orderBy(desc(logs.created_at), desc(logs.id))
			.limit(limit)
			.offset(offset),
		d1.select({ count: count() }).from(logs).where(filter)
	]);
	// Selected once: a batch maps rows by column name, so a second alias of the same column
	// would shift every value after it.
	return {
		logs: rows.map((row) => ({ ...row, timestamp: row.created_at })),
		logs_aggregate: { aggregate: { count: total?.count ?? 0 } }
	};
};
