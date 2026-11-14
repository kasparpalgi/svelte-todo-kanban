/** @file src/routes/api/runner/__tests__/d1.test.ts */
// POST /api/runner/<op> with DATA_BACKEND=d1, on a real migrated SQLite (#247).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';

const TOKEN = 'r'.repeat(40);
vi.mock('$env/dynamic/private', () => ({ env: { RUNNER_API_TOKEN: TOKEN, DATA_BACKEND: 'd1' } }));

const storeFile = vi.fn(async () => ({ success: true, url: 'https://cdn/shot.png' }));
vi.mock('$lib/server/storeFile', () => ({
	getR2Credentials: (settings: unknown) => settings,
	storeFile: (...a: unknown[]) => storeFile(...(a as []))
}));

const { POST } = await import('../[op]/+server');
const upload = (await import('../upload/+server')).POST;

const U = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const L1 = '33333333-3333-4333-8333-333333333331';
const L2 = '33333333-3333-4333-8333-333333333332';
const C1 = '44444444-4444-4444-8444-444444444441';
const C2 = '44444444-4444-4444-8444-444444444442';

let sqlite: DatabaseSync;

beforeEach(() => {
	sqlite = migratedSqlite();
	sqlite.exec(`
		INSERT INTO users (id, username, email) VALUES ('${U}', 'me', 'me@example.com');
		INSERT INTO boards (id, user_id, name, alias, github_repo) VALUES
			('${B}', '${U}', 'App', 'app', 'Acme/App'),
			('b2', '${U}', 'app 2', 'app-2', 'acme/app-2'),
			('b3', '${U}', 'Plain', 'plain', NULL);
		INSERT INTO lists (id, board_id, name, sort_order) VALUES
			('${L2}', '${B}', 'Done', 2), ('${L1}', '${B}', 'Todo', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias, task_file_path, created_at, agent_machine) VALUES
			('${C1}', '${U}', '${L1}', 'One', 'one', 'doc/1-TODO.md', '2026-01-01T00:00:00.000Z', NULL),
			('${C2}', '${U}', NULL, 'Two', 'two', 'doc/2-TODO.md', '2026-01-02T00:00:00.000Z', 'karel');`);
});

async function post(op: string, body: unknown) {
	const request = new Request(`http://x/api/runner/${op}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${TOKEN}` },
		body: JSON.stringify(body)
	});
	const platform = { env: { DB: sqliteD1(sqlite) } };
	const response = await POST({ params: { op }, request, platform } as never);
	const json = await response.json();
	return response.status === 200 ? json.data : { status: response.status, ...json };
}

describe('runner ops on D1', () => {
	it('finds a board by its exact repo, any case, with lists in order', async () => {
		expect(await post('board', { repo: 'acme/app' })).toEqual({
			id: B,
			user_id: U,
			lists: [
				{ id: L1, name: 'Todo' },
				{ id: L2, name: 'Done' }
			]
		});
		expect(await post('board', { repo: 'acme/ap' })).toBeNull();
	});

	it('lists connected boards by name and sets a board’s repo from its JSON', async () => {
		const boards = await post('boards', {});
		expect(boards.map((b: { id: string }) => b.id)).toEqual([B, 'b2']);
		expect(boards[0].github).toBe('{"owner":"Acme","repo":"App","full_name":"Acme/App"}');
		const github = JSON.stringify({ owner: 'o', repo: 'r', full_name: 'o/r' });
		expect(await post('setBoardGithub', { id: B, github })).toEqual({ id: B });
		expect((await post('board', { repo: 'o/r' })).id).toBe(B);
		const missing = '55555555-5555-4555-8555-555555555555';
		expect((await post('setBoardGithub', { id: missing, github })).status).toBe(404);
		expect((await post('setBoardGithub', { id: B, github: 'nope' })).status).toBe(400);
	});

	it('lists cards by ids or paths, oldest first, with their list', async () => {
		expect(await post('cards', { paths: ['doc/2-TODO.md', 'doc/1-TODO.md', 'x'] })).toEqual([
			{ id: C1, task_file_path: 'doc/1-TODO.md', list: { name: 'Todo' } },
			{ id: C2, task_file_path: 'doc/2-TODO.md', list: null }
		]);
		const many = [C2, ...Array.from({ length: 300 }, (_, i) => crypto.randomUUID())];
		expect((await post('cards', { ids: many })).map((c: { id: string }) => c.id)).toEqual([C2]);
	});

	it('creates a card with the next free alias, then moves and deletes it', async () => {
		const card = { list_id: L1, user_id: U, content: '', task_file_path: 'doc/3-TODO.md' };
		const { id } = await post('createCard', { ...card, title: 'One' });
		expect(sqlite.prepare('SELECT alias FROM todos WHERE id = ?').get(id)).toEqual({
			alias: 'one1'
		});
		const set = { list_id: L2, github_synced_at: '2026-01-01T02:00:00+02:00' };
		expect(await post('updateCard', { id, set })).toEqual({ updated: true });
		expect(sqlite.prepare('SELECT github_synced_at FROM todos WHERE id = ?').get(id)).toEqual({
			github_synced_at: '2026-01-01T00:00:00.000Z'
		});
		expect(await post('deleteCard', { id })).toEqual({ deleted: true });
		expect(await post('deleteCard', { id })).toEqual({ deleted: false });
	});

	it('claims a free card or one this machine holds, and releases only its own', async () => {
		expect(await post('claimCard', { id: C1, machine: 'mac' })).toEqual({ claimed: true });
		expect(await post('claimCard', { id: C1, machine: 'mac' })).toEqual({ claimed: true });
		expect(await post('claimCard', { id: C2, machine: 'mac' })).toEqual({ claimed: false });
		expect(await post('releaseCard', { id: C2, machine: 'mac' })).toEqual({ released: false });
		expect(await post('releaseCard', { id: C1, machine: 'MAC' })).toEqual({ released: true });
	});

	it('writes and narrows comments, newest first', async () => {
		const a = await post('createComment', { todoId: C1, userId: U, content: 'a' });
		sqlite.exec(`UPDATE comments SET created_at = '2020-01-01T00:00:00.000Z'`);
		const b = await post('createComment', { todoId: C1, userId: U, content: 'b' });
		expect(await post('comments', { todoId: C1 })).toEqual([
			{ id: b.id, content: 'b' },
			{ id: a.id, content: 'a' }
		]);
		expect(await post('updateComment', { id: a.id, content: 'a2' })).toEqual({ id: a.id });
		expect(await post('comments', { todoId: C1, userId: U, content: 'a2' })).toEqual([
			{ id: a.id, content: 'a2' }
		]);
		expect((await post('updateComment', { id: C2, content: 'x' })).status).toBe(404);
	});

	it('upserts prices and usage on their keys', async () => {
		const price = { input_per_mtok: 3, output_per_mtok: 15, cache_write_per_mtok: 3.75 };
		const rows = Array.from({ length: 30 }, (_, i) => ({
			model: `m${String(i).padStart(2, '0')}`,
			...price,
			cache_read_per_mtok: 0.3
		}));
		expect(await post('upsertPricing', { rows })).toEqual({ affected: 30 });
		await post('upsertPricing', { rows: [{ ...rows[0], input_per_mtok: 5, source: 's' }] });
		const prices = await post('pricing', {});
		expect(prices).toHaveLength(30);
		expect(prices[0]).toEqual({
			model: 'm00',
			...price,
			input_per_mtok: 5,
			cache_read_per_mtok: 0.3
		});

		const row = {
			session_id: 's1',
			todo_id: C1,
			user_id: U,
			repo: 'acme/app',
			model: 'opus',
			input_tokens: 1,
			output_tokens: 2,
			cache_read_tokens: 3,
			cache_write_tokens: 4,
			usage_by_model: { opus: 1 },
			cost_usd: 0.5,
			started_at: null,
			ended_at: null
		};
		const first = await post('recordUsage', { row });
		const again = await post('recordUsage', { row: { ...row, cost_usd: 0.75 } });
		expect(again).toEqual(first);
		expect(sqlite.prepare('SELECT cost_usd, usage_by_model FROM claude_usage').all()).toEqual([
			{ cost_usd: 0.75, usage_by_model: '{"opus":1}' }
		]);
		const timed = {
			...row,
			session_id: 's2',
			todo_id: null,
			started_at: '2026-03-01T02:00:00+02:00'
		};
		await post('recordUsage', { row: timed });
		sqlite.exec(`UPDATE todos SET agent_effort = 'high'`);
		await post('recordUsage', {
			row: { ...timed, session_id: 's3', todo_id: C1, started_at: '2026-03-01T01:00:00Z' }
		});
		const since = await post('usage', { since: '2026-03-01T00:00:00Z' });
		expect(since.map((r: { todo: unknown; started_at: string }) => [r.todo, r.started_at])).toEqual(
			[
				[null, '2026-03-01T00:00:00.000Z'],
				[{ agent_effort: 'high' }, '2026-03-01T01:00:00.000Z']
			]
		);
		expect(await post('usage', { since: '2026-03-02T00:00:00Z' })).toEqual([]);
	});

	it('attaches an upload to a card, with the owner’s R2 token from user_secrets', async () => {
		sqlite.exec(
			`INSERT INTO user_secrets (user_id, name, value) VALUES ('${U}', 'r2', '{"encrypted":"e"}')`
		);
		const send = (todoId: string) => {
			const form = new FormData();
			form.set('todo_id', todoId);
			form.set('file', new File([new Uint8Array([137])], 'shot.png', { type: 'image/png' }));
			const headers = { Authorization: `Bearer ${TOKEN}` };
			const request = new Request('http://x/api/runner/upload', {
				method: 'POST',
				headers,
				body: form
			});
			return upload({ request, platform: { env: { DB: sqliteD1(sqlite) } } } as never);
		};
		expect(await (await send(C1)).json()).toEqual({ success: true, url: 'https://cdn/shot.png' });
		expect(storeFile.mock.calls[0].slice(1)).toEqual([U, { tokens: { r2: { encrypted: 'e' } } }]);
		expect(await post('uploads', { todoId: C1 })).toEqual([{ url: 'https://cdn/shot.png' }]);
		expect((await send('nope')).status).toBe(404);
	});
});
