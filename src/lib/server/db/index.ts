/** @file src/lib/server/db/index.ts */
// The D1 database as Drizzle sees it. `DATA_BACKEND=d1` makes the data ops use it (#233).
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as cardRelations from './cardRelations';
import * as ownedRelations from './ownedRelations';
import * as relations from './relations';
import * as tables from './schema';

export const schema = { ...tables, ...relations, ...cardRelations, ...ownedRelations };
export type D1 = DrizzleD1Database<typeof schema>;

// `drizzle()` maps every table's relations, about a millisecond of CPU, and a request built
// two (the op and Auth.js). The binding lives as long as the isolate, so keep one (#261).
const built = new WeakMap<D1Database, D1>();

export function d1(binding: D1Database): D1 {
	let db = built.get(binding);
	if (!db) built.set(binding, (db = drizzle(binding, { schema })));
	return db;
}
