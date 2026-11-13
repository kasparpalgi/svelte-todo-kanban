/** @file src/lib/server/db/index.ts */
// The D1 database as Drizzle sees it. `DATA_BACKEND=d1` makes the data ops use it (#233).
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as relations from './relations';
import * as tables from './schema';

export const schema = { ...tables, ...relations };
export type D1 = DrizzleD1Database<typeof schema>;

export const d1 = (binding: D1Database): D1 => drizzle(binding, { schema });
