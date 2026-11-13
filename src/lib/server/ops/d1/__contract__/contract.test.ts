/** @file src/lib/server/ops/d1/__contract__/contract.test.ts */
// Contract tests (#233): every D1 op against production Hasura, same input, same JSON.
// Skipped unless CONTRACT=1. Copy Postgres into the local D1 first (free, ~15 s):
//   node scripts/d1/copy-from-postgres.mjs
//   CONTRACT=1 npx vitest --run --project=server src/lib/server/ops/d1/__contract__
// Reads run for every user and board. CONTRACT_WRITES=1 also creates, edits and deletes
// one board as the e2e test user on both sides (production gets that board for seconds).
import { execSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import { d1 } from '$lib/server/db';
import { sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { ops, type OpName } from '../../index';
import { runOp } from '../../run';
import { firstDiff, normalize } from './compare';

const on = !!process.env.CONTRACT;
const LOCAL = 'find .wrangler/state/v3/d1 -name "*.sqlite" ! -name metadata.sqlite';

function local() {
	const sqlite = new DatabaseSync(execSync(LOCAL, { encoding: 'utf8' }).trim().split('\n')[0]);
	sqlite.exec('PRAGMA foreign_keys = ON');
	return { sqlite, db: d1(sqliteD1(sqlite)) };
}

type Case = { op: OpName; userId: string; input: unknown };

async function both({ op, userId, input }: Case, db: ReturnType<typeof d1>, ignore?: RegExp) {
	const parsed = ops[op].input.parse(input);
	const settle = (p: Promise<unknown>) =>
		p.then(
			(data) => ({ data }),
			(e) => ({ error: (e as { status?: number }).status ?? String(e) })
		);
	const [hasura, mine] = await Promise.all([
		settle(runOp(op, { userId, db: serverRequest }, parsed)),
		settle(runOp(op, { userId, db: serverRequest, d1: db }, parsed))
	]);
	const strip = (v: unknown) =>
		ignore ? JSON.parse(JSON.stringify(v, (k, x) => (ignore.test(k) ? undefined : x))) : v;
	return { hasura: normalize(strip(hasura)), d1: normalize(strip(mine)) };
}

/** Runs the cases 8 at a time; returns the ones whose JSON differs. */
async function compare(cases: Case[], db: ReturnType<typeof d1>, ignore?: RegExp) {
	const failed: string[] = [];
	for (let i = 0; i < cases.length; i += 8) {
		const results = await Promise.all(cases.slice(i, i + 8).map((c) => both(c, db, ignore)));
		results.forEach((r, j) => {
			const diff = firstDiff(r.hasura, r.d1);
			const c = cases[i + j];
			if (diff) failed.push(`${c.op} ${JSON.stringify(c.input)} as ${c.userId}: ${diff}`);
		});
	}
	return failed;
}

describe.skipIf(!on)('D1 ops equal Hasura', () => {
	const { sqlite, db } = on ? local() : ({} as ReturnType<typeof local>);
	const all = <T>(sql: string, ...p: string[]) => sqlite.prepare(sql).all(...p) as T[];
	const users = on ? all<{ id: string }>(`SELECT id FROM users`) : [];
	const boards = on
		? all<{ id: string; alias: string; user_id: string }>(`SELECT id, alias, user_id FROM boards`)
		: [];
	const testUser = on
		? all<{ id: string }>(`SELECT id FROM users WHERE username = 'test'`)[0]?.id
		: '';

	it('getBoards for every user, open and archived', { timeout: 120_000 }, async () => {
		const cases = users.flatMap(({ id }) => [
			{ op: 'getBoards' as const, userId: id, input: {} },
			{ op: 'getBoards' as const, userId: id, input: { archived: true } }
		]);
		expect(await compare(cases, db)).toEqual([]);
	});

	it('getBoard for every board, as its owner and as a stranger', { timeout: 120_000 }, async () => {
		const cases = boards.flatMap((b) => [
			{ op: 'getBoard' as const, userId: b.user_id, input: { alias: b.alias } },
			{ op: 'getBoard' as const, userId: testUser, input: { alias: b.alias } }
		]);
		expect(await compare(cases, db)).toEqual([]);
	});

	it('poll for every board as its owner, and without a board', { timeout: 120_000 }, async () => {
		const cases = boards.map((b) => ({
			op: 'poll' as const,
			userId: b.user_id,
			input: { boardId: b.id }
		}));
		cases.push({ op: 'poll', userId: testUser, input: {} as { boardId: string } });
		expect(await compare(cases, db)).toEqual([]);
	});

	it(
		'getLogs for the users with logs, up to the newest copied log',
		{ timeout: 120_000 },
		async () => {
			const to = all<{ t: string }>(`SELECT max(created_at) AS t FROM logs`)[0].t;
			const from = new Date(Date.now() - 25 * 86_400_000).toISOString();
			const loggers = all<{ user_id: string }>(
				`SELECT user_id FROM logs WHERE user_id IS NOT NULL GROUP BY user_id ORDER BY count(*) DESC LIMIT 5`
			);
			const cases = loggers.flatMap(({ user_id }) =>
				[
					{},
					{ level: 'error' },
					{ component: 'board' },
					{ search: 'load', limit: 10, offset: 5 }
				].map((filter) => ({
					op: 'getLogs' as const,
					userId: user_id,
					input: { from, to, ...filter }
				}))
			);
			// D1 keeps one log time (#232): `created_at` is the event time, Hasura's `timestamp`.
			expect(await compare(cases, db, /^created_at$/)).toEqual([]);
		}
	);

	it.skipIf(!process.env.CONTRACT_WRITES)(
		'createBoard → updateBoard → deleteBoard as the test user',
		async () => {
			const ctx = (withD1: boolean) => ({
				userId: testUser,
				db: serverRequest,
				...(withD1 && { d1: db })
			});
			const name = `Contract ${Date.now()}`;
			const [h, l] = (await Promise.all(
				[false, true].map((w) =>
					runOp('createBoard', ctx(w), ops.createBoard.input.parse({ name }))
				)
			)) as { id: string }[];
			const strip = (v: unknown) =>
				JSON.parse(
					JSON.stringify(v, (k, x) =>
						/^(id|board_id|created_at|updated_at)$/.test(k) ? undefined : x
					)
				);
			expect(strip(normalize(l))).toEqual(strip(normalize(h)));

			const set = {
				name: `${name} edited`,
				github: JSON.stringify({ owner: 'o', repo: 'r', full_name: 'o/r' }),
				is_public: true,
				settings: { enable_hour_tracking: true },
				archived_at: '2026-11-13T12:00:00.000Z'
			};
			const [hu, lu] = await Promise.all(
				[h, l].map((b, i) =>
					runOp('updateBoard', ctx(i === 1), ops.updateBoard.input.parse({ id: b.id, set }))
				)
			);
			expect(strip(normalize(lu))).toEqual(strip(normalize(hu)));

			const deleted = await Promise.all(
				[h, l].map((b, i) => runOp('deleteBoard', ctx(i === 1), { id: b.id }))
			);
			expect(deleted[1]).toEqual(deleted[0]);
		}
	);
});
