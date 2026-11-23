/** @file src/lib/server/ops/d1/sql.ts */
// D1 limits the ops work around: 100 bound parameters per statement, 50-byte LIKE patterns.
import { sql, type AnyColumn, type SQL } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';

/**
 * A query built once per database, run with `sql.placeholder()` values. Drizzle spends more
 * CPU writing a relational query's SQL than D1 spends running it, and Workers Free allows
 * 10 ms a request (#261). `build` returns the query's `.prepare()`.
 */
export function prepared<Q>(build: (d1: D1) => Q) {
	const made = new WeakMap<D1, Q>();
	return (d1: D1) => {
		let query = made.get(d1);
		if (!query) made.set(d1, (query = build(d1)));
		return query;
	};
}

const MAX_PARAMS = 100;

/**
 * One statement per chunk of rows, each under D1's 100 parameters, for one `d1.batch()`
 * (a batch counts as one of the 50 queries a request may make).
 */
export function inChunks<R extends Record<string, unknown>, S>(
	rows: R[],
	statement: (chunk: R[]) => S
): [S, ...S[]] {
	const size = Math.max(1, Math.floor(MAX_PARAMS / Object.keys(rows[0] ?? { x: 0 }).length));
	const out: S[] = [];
	for (let i = 0; i < rows.length; i += size) out.push(statement(rows.slice(i, i + size)));
	return out as [S, ...S[]];
}

/**
 * Case-insensitive "contains", Hasura's `_ilike '%text%'`. `instr` because D1 caps LIKE
 * patterns at 50 bytes. SQLite's `lower()` folds ASCII only, so the needle is folded the same way.
 */
export const contains = (column: AnyColumn | SQL, text: string) =>
	sql`instr(lower(${column}), ${asciiLower(text)}) > 0`;

const asciiLower = (text: string) => text.replace(/[A-Z]/g, (c) => c.toLowerCase());

/** `column IN (values)` with one bound parameter however many values there are: the list
 * goes in as JSON and `json_each` unpacks it, so 500 ids stay under D1's 100-parameter cap. */
export const inList = (column: AnyColumn, values: string[]) =>
	sql`${column} in (select value from json_each(${JSON.stringify(values)}))`;

/** A client time as ISO UTC with milliseconds, the form every D1 time column holds. */
export const iso = (time: string) => new Date(time).toISOString();

/** Case-insensitive equality, Hasura's `_ilike` with a pattern that has no wildcards. */
export const sameText = (column: AnyColumn, text: string) =>
	sql`${column} = ${text} collate nocase`;
