/** @file src/lib/server/db/schema/columns.ts */
// Column conventions for the D1 schema (#232). Column names are the Postgres/Hasura
// field names, so D1 rows come back in the shape the stores already read.
import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

/** ISO-8601 UTC with milliseconds: the string `new Date().toISOString()` gives. Sorts as text. */
export const NOW = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

/** A UUID text id, made in code. Copied rows keep their Postgres ids, so URLs, GitHub
 * links and runner card ids keep working. */
export const id = () =>
	text()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

export const createdAt = () => text().notNull().default(NOW);
export const updatedAt = () =>
	text()
		.notNull()
		.default(NOW)
		.$onUpdateFn(() => new Date().toISOString());

/** Stored as 0/1. */
export const bool = () => integer({ mode: 'boolean' });

/** JSON stored as text. */
export const json = <T = unknown>() => text({ mode: 'json' }).$type<T>();
