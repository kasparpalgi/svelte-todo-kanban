/** @file src/lib/server/runner/d1/types.ts */
// A runner op on D1 takes the same input and returns the same type as its Hasura `run`
// in ../cards.ts or ../extras.ts, so the runner gets the same JSON (#247).
import type { D1 } from '$lib/server/db';
import type { Ctx } from '$lib/server/ops/op';
import type { runnerOps, RunnerOpName } from '../index';

type Run<K extends RunnerOpName> = (typeof runnerOps)[K]['run'];

export type RunnerD1Run<K extends RunnerOpName> = (
	ctx: Ctx & { d1: D1 },
	input: Parameters<Run<K>>[1]
) => ReturnType<Run<K>>;
