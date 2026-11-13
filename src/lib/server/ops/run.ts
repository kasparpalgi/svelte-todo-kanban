/** @file src/lib/server/ops/run.ts */
// Runs an op on the backend `DATA_BACKEND` names: `hasura` (default) or `d1` (#233).
// On D1 the Hasura client throws, so a code path not yet ported fails loudly instead of
// reading a second database.
import { env } from '$env/dynamic/private';
import { serverRequest } from '$lib/graphql/server-client';
import { d1 } from '$lib/server/db';
import { d1Loaders } from './d1';
import type { OpName } from './index';
import { loadOp } from './loaders';
import { OpError, type Ctx, type Db } from './op';

const hasuraOff: Db = async () => {
	throw new Error('Hasura is off: DATA_BACKEND=d1');
};

export function opCtx(userId: string | null, platform: App.Platform | undefined): Ctx {
	if (env.DATA_BACKEND !== 'd1') return { userId, db: serverRequest };
	const binding = platform?.env?.DB;
	if (!binding) throw new Error('DATA_BACKEND=d1 but the DB binding is missing');
	return { userId, db: hasuraOff, d1: d1(binding) };
}

/** The op's run for this ctx's backend. Input must already be parsed by `op.input`. */
export async function runOp(name: OpName, ctx: Ctx, input: unknown): Promise<unknown> {
	if (!ctx.d1) return (await loadOp(name)).run(ctx, input);
	const load = d1Loaders[name as keyof typeof d1Loaders];
	if (!load) throw new OpError(501, `${name} is not on D1 yet`);
	return ((await load()) as (c: Ctx, i: unknown) => Promise<unknown>)(ctx, input);
}
