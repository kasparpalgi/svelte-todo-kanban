/** @file src/lib/server/runner/d1/index.ts */
// Every runner op on D1 (#247). /api/runner/<op> imports this only with DATA_BACKEND=d1.
import type { RunnerOpName } from '../index';
import * as cards from './cards';
import * as extras from './extras';
import type { RunnerD1Run } from './types';

export const runnerD1 = { ...cards, ...extras } satisfies {
	[K in RunnerOpName]: RunnerD1Run<K>;
};
