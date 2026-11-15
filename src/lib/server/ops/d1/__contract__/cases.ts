/** @file src/lib/server/ops/d1/__contract__/cases.ts */
// Runs one op on Hasura and on D1 with the same input and reports where the JSON differs.
import { serverRequest } from '$lib/graphql/server-client';
import type { d1 } from '$lib/server/db';
import { ops, type OpName } from '../../index';
import { runOp } from '../../run';
import { firstDiff, normalize } from './compare';

export type Case = { op: OpName; userId: string; input: unknown };

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
export async function compare(cases: Case[], db: ReturnType<typeof d1>, ignore?: RegExp) {
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
