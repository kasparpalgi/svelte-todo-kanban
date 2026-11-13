/** @file src/lib/server/db/__tests__/sqliteD1.ts */
// A D1 binding over node:sqlite, so tests run the real Drizzle D1 driver and SQL: just the
// calls Drizzle makes (prepare → bind → all/raw/run, and batch in one transaction).
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { D1Database } from '@cloudflare/workers-types';

class Statement {
	constructor(
		private db: DatabaseSync,
		private sql: string,
		private params: SQLInputValue[] = []
	) {}
	bind(...params: unknown[]) {
		return new Statement(this.db, this.sql, params as SQLInputValue[]);
	}
	private stmt() {
		return this.db.prepare(this.sql);
	}
	async all() {
		return { results: this.stmt().all(...this.params), success: true, meta: {} };
	}
	async raw() {
		return this.stmt()
			.all(...this.params)
			.map((row) => Object.values(row));
	}
	async run() {
		const { changes } = this.stmt().run(...this.params);
		return { results: [], success: true, meta: { changes: Number(changes) } };
	}
	/** One batch item: rows when the statement returns any, the change count otherwise. */
	exec() {
		const stmt = this.stmt();
		if (stmt.columns().length) return { results: stmt.all(...this.params), meta: {} };
		const { changes } = stmt.run(...this.params);
		return { results: [], meta: { changes: Number(changes) } };
	}
}

export function sqliteD1(db: DatabaseSync) {
	return {
		prepare: (sql: string) => new Statement(db, sql),
		async batch(statements: Statement[]) {
			db.exec('BEGIN');
			try {
				const results = statements.map((s) => s.exec());
				db.exec('COMMIT');
				return results;
			} catch (error) {
				db.exec('ROLLBACK');
				throw error;
			}
		}
	} as unknown as D1Database;
}

/** An in-memory database with every migration applied and foreign keys on, as on D1. */
export function migratedSqlite() {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync('drizzle')
		.filter((f) => f.endsWith('.sql'))
		.sort()) {
		db.exec(readFileSync(`drizzle/${file}`, 'utf8').replaceAll('--> statement-breakpoint', ''));
	}
	return db;
}
