/** @file src/lib/server/ops/op.ts */
// One server operation behind POST /api/data/<op>. Every op reaches the database only
// through `ctx.db`: Hasura with the admin secret today, D1 in phase 2 (#226).
import type { z } from 'zod';
import type { serverRequest } from '$lib/graphql/server-client';

export type Db = typeof serverRequest;

export type Ctx = { userId: string | null; db: Db };
export type UserCtx = Ctx & { userId: string };

type Auth = 'user' | 'public';

export type Op<S extends z.ZodType = z.ZodType, R = unknown, A extends Auth = Auth> = {
	input: S;
	auth: A;
	// Method syntax on purpose: the endpoint calls any op through the wide `Op` type.
	run(ctx: A extends 'user' ? UserCtx : Ctx, input: z.output<S>): Promise<R>;
};

export function defineOp<S extends z.ZodType, R, A extends Auth>(op: Op<S, R, A>) {
	return op;
}

/** Thrown by an op to answer with this status and message instead of a 500. */
export class OpError extends Error {
	constructor(
		readonly status: 400 | 403 | 404,
		message: string
	) {
		super(message);
	}
}
