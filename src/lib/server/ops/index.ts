/** @file src/lib/server/ops/index.ts */
// Every op the browser can call as POST /api/data/<name>.
import { createLog, getLogs } from './logs';
import { poll } from './poll';

export const ops = { createLog, getLogs, poll };

export type Ops = typeof ops;
export type OpName = keyof Ops;
