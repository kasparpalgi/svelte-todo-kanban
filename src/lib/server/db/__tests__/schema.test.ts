/** @file src/lib/server/db/__tests__/schema.test.ts */
// The D1 migrations on a real SQLite (node:sqlite), with foreign keys on as in D1: they
// apply, and keep the conventions the copy script and the ops rely on (#232).
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { literal } from '../../../../../scripts/d1/literal.mjs';

const dir = 'drizzle';
let db: DatabaseSync;

beforeEach(() => {
	db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	for (const file of readdirSync(dir)
		.filter((f) => f.endsWith('.sql'))
		.sort()) {
		db.exec(readFileSync(`${dir}/${file}`, 'utf8').replaceAll('--> statement-breakpoint', ''));
	}
	db.exec(`INSERT INTO users (id, username) VALUES ('u1', 'ann');
		INSERT INTO boards (id, user_id, name, alias) VALUES ('b1', 'u1', 'Board', 'board');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES ('l1', 'b1', 'To do', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias) VALUES ('t1', 'u1', 'l1', 'Card', 'card');`);
});

const one = (sql: string) => db.prepare(sql).get() as Record<string, unknown>;

describe('D1 schema', () => {
	it('has the planned tables: user_secrets, and no sessions', () => {
		const names = (
			db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as {
				name: string;
			}[]
		).map((r) => r.name);
		expect(names).toContain('user_secrets');
		expect(names).not.toContain('sessions');
	});

	it('defaults timestamps to the toISOString() shape, so text order is time order', () => {
		const { created_at, changed_at } = one(`SELECT created_at, changed_at FROM boards`);
		for (const value of [created_at, changed_at]) {
			expect(value).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
		}
	});

	it('keeps the Postgres CHECKs', () => {
		expect(() => db.exec(`UPDATE todos SET priority = 'urgent'`)).toThrow(/CHECK/);
		expect(() => db.exec(`UPDATE todos SET priority = NULL`)).not.toThrow();
	});

	it('deleting a board cascades to its lists, cards and comments', () => {
		db.exec(`INSERT INTO comments (id, todo_id, user_id, content) VALUES ('c1', 't1', 'u1', 'Hi')`);
		db.exec(`DELETE FROM boards WHERE id = 'b1'`);
		expect(
			one(`SELECT (SELECT count(*) FROM todos) + (SELECT count(*) FROM comments) AS n`).n
		).toBe(0);
	});

	it('literal() round-trips the values the copy script writes', () => {
		const title = "it's 'quoted'\nand 💼 on a new line";
		db.exec(`UPDATE todos SET title = ${literal(title)}, min_hours = ${literal(1.5)},
			has_time = ${literal(true)}, content = ${literal(null)}`);
		expect(one(`SELECT title, min_hours, has_time, content FROM todos`)).toEqual({
			title,
			min_hours: 1.5,
			has_time: 1,
			content: null
		});
	});
});
