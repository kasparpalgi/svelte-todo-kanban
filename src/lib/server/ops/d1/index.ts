/** @file src/lib/server/ops/d1/index.ts */
// The ops that have a D1 version, each loaded when called. With `DATA_BACKEND=d1` an op
// missing here answers 501, so a half-ported staging Worker never reads Hasura (#233, #247).
import type { D1Runs } from './types';

type Loaders = { [K in keyof D1Runs]: () => Promise<NonNullable<D1Runs[K]>> };

export const d1Loaders: Loaders = {
	createLog: () => import('./logs').then((m) => m.createLog),
	getLogs: () => import('./logs').then((m) => m.getLogs),
	poll: () => import('./poll').then((m) => m.poll),
	getBoards: () => import('./boards').then((m) => m.getBoards),
	getBoard: () => import('./boards').then((m) => m.getBoard),
	createBoard: () => import('./boards').then((m) => m.createBoard),
	updateBoard: () => import('./boards').then((m) => m.updateBoard),
	deleteBoard: () => import('./boards').then((m) => m.deleteBoard)
};
