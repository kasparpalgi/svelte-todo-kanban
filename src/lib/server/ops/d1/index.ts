/** @file src/lib/server/ops/d1/index.ts */
// The ops that have a D1 version. With `DATA_BACKEND=d1` an op missing here answers 501,
// so a half-ported staging Worker never reads Hasura (#233).
import { createBoard, deleteBoard, getBoard, getBoards, updateBoard } from './boards';
import { createLog, getLogs } from './logs';
import { poll } from './poll';
import type { D1Runs } from './types';

export const d1Runs: D1Runs = {
	createLog,
	getLogs,
	poll,
	getBoards,
	getBoard,
	createBoard,
	updateBoard,
	deleteBoard
};
