/** @file src/lib/server/ops/d1/types.ts */
// A D1 implementation of an op takes the same input and must return the same type as
// its Hasura `run`, so the stores get the same JSON (#233).
import type { D1 } from '$lib/server/db';
import type { Ops } from '../index';

type Run<K extends keyof Ops> = Ops[K]['run'];

export type D1Run<K extends keyof Ops> = (
	ctx: Parameters<Run<K>>[0] & { d1: D1 },
	input: Parameters<Run<K>>[1]
) => ReturnType<Run<K>>;

export type D1Runs = { [K in keyof Ops]?: D1Run<K> };
