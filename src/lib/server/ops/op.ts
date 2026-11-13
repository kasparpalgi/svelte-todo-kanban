/** @file src/lib/server/ops/op.ts */
// One server operation behind POST /api/data/<op>. Every op reaches the database only
// through the ctx: `db` is Hasura with the admin secret; with `DATA_BACKEND=d1` the op's
// D1 version (ops/d1) runs instead and gets `d1` (#226, #233).
import type { z } from 'zod';
import type { serverRequest } from '$lib/graphql/server-client';
import type { D1 } from '$lib/server/db';

export type Db = typeof serverRequest;

export type Ctx = { userId: string | null; db: Db; d1?: D1 };
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
		readonly status: 400 | 403 | 404 | 501,
		message: string
	) {
		super(message);
	}
}
