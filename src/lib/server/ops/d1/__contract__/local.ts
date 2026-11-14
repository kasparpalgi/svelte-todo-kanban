/** @file src/lib/server/ops/d1/__contract__/local.ts */
// The local D1 copy the contract tests read (node scripts/d1/copy-from-postgres.mjs): the
// biggest wrangler SQLite file, since a migrated-but-empty `todzz` may sit next to it.
import { execSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { d1 } from '$lib/server/db';
import { sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';

const LOCAL = 'ls -S $(find .wrangler/state/v3/d1 -name "*.sqlite" ! -name metadata.sqlite)';

export function local() {
	const sqlite = new DatabaseSync(execSync(LOCAL, { encoding: 'utf8' }).trim().split('\n')[0]);
	sqlite.exec('PRAGMA foreign_keys = ON');
	return { sqlite, db: d1(sqliteD1(sqlite)) };
}
