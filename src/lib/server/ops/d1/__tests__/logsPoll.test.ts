/** @file src/lib/server/ops/d1/__tests__/logsPoll.test.ts */
// createLog, getLogs and poll on a real migrated SQLite (#233).
import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { d1, type D1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { ops, type OpName } from '../../index';
import { runOp } from '../../run';

const B = '11111111-1111-4111-8111-111111111111';
let sqlite: DatabaseSync;
let db: D1;

beforeEach(() => {
	sqlite = migratedSqlite();
	db = d1(sqliteD1(sqlite));
	sqlite.exec(`
		INSERT INTO users (id, username) VALUES ('me', 'me'), ('ann', 'ann');
		INSERT INTO boards (id, user_id, name, alias, changed_at, updated_at)
			VALUES ('${B}', 'me', 'B', 'b', '2026-11-13T10:00:00.000Z', '2026-11-12T10:00:00.000Z');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES ('l1', '${B}', 'To do', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias, updated_at) VALUES
			('t1', 'me', 'l1', 'One', 'one', '2026-11-13T09:00:00.000Z'),
			('t2', 'me', 'l1', 'Two', 'two', '2026-11-13T11:00:00.000Z');
		INSERT INTO notifications (id, user_id, todo_id, type, is_read) VALUES
			('n1', 'me', 't1', 'assigned', 0), ('n2', 'me', 't2', 'assigned', 1),
			('n3', 'ann', 't1', 'assigned', 0);`);
});

const run = (name: OpName, input: unknown, userId = 'me') =>
	runOp(name, { userId, db: async () => ({}) as never, d1: db }, ops[name].input.parse(input));

describe('poll', () => {
	it('stamps the board with changed_at, updated_at, card count and newest card', async () => {
		expect(await run('poll', { boardId: B })).toEqual({
			board: '2026-11-13T10:00:00.000Z|2026-11-12T10:00:00.000Z|2|2026-11-13T11:00:00.000Z',
			unread: 1
		});
	});

	it('gives only the unread count without a readable board', async () => {
		expect(await run('poll', {})).toEqual({ board: null, unread: 1 });
		expect(await run('poll', { boardId: B }, 'ann')).toEqual({ board: null, unread: 1 });
	});
});

describe('createLog / getLogs', () => {
	const log = (i: number, extra = {}) => ({
		level: 'info',
		component: `Comp${i % 2}`,
		message: `Message ${i}`,
		data: `{"i":${i}}`,
		timestamp: new Date(Date.UTC(2026, 10, 13, 10, 0, i)).toISOString(),
		...extra
	});

	it('saves 50 logs at once (chunked under D1’s 100 parameters) and reads them back newest first', async () => {
		const logs = Array.from({ length: 50 }, (_, i) => log(i));
		expect(await run('createLog', { logs })).toEqual({ saved: 50 });
		const page = (await run('getLogs', { limit: 2 })) as {
			logs: Record<string, unknown>[];
			logs_aggregate: { aggregate: { count: number } };
		};
		expect(page.logs_aggregate.aggregate.count).toBe(50);
		expect(page.logs.map((l) => l.message)).toEqual(['Message 49', 'Message 48']);
		expect(page.logs[0]).toMatchObject({
			timestamp: '2026-11-13T10:00:49.000Z',
			data: '{"i":49}',
			user_id: 'me'
		});
	});

	it('clamps a future client time to now, so the prune can reach it', async () => {
		await run('createLog', { logs: [log(1, { timestamp: '2099-01-01T00:00:00Z' })] });
		const { created_at } = sqlite.prepare(`SELECT created_at FROM logs`).get() as {
			created_at: string;
		};
		expect(created_at < '2099').toBe(true);
	});

	it('filters by level, component and text (case-insensitive), and by time', async () => {
		await run('createLog', {
			logs: [log(1), log(2, { level: 'error', message: 'Board LOAD failed' }), log(3)]
		});
		await run('createLog', { logs: [log(4)] }, 'ann');
		const messages = async (input: object) =>
			((await run('getLogs', input)) as { logs: { message: string }[] }).logs.map((l) => l.message);
		expect(await messages({ level: 'error' })).toEqual(['Board LOAD failed']);
		expect(await messages({ component: 'comp1' })).toEqual(['Message 3', 'Message 1']);
		expect(await messages({ search: 'load F' })).toEqual(['Board LOAD failed']);
		expect(await messages({ from: '2026-11-13T12:00:02+02:00' })).toEqual([
			'Message 3',
			'Board LOAD failed'
		]);
	});
});
