/** @file src/lib/server/ops/d1/__tests__/boards.test.ts */
// The D1 board ops on a real migrated SQLite: the access rules of ops/boards.ts, and
// what the Postgres triggers did on insert (#233).
import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { d1, type D1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { ops, type OpName } from '../../index';
import { OpError } from '../../op';
import { runOp } from '../../run';

let sqlite: DatabaseSync;
let db: D1;

beforeEach(() => {
	sqlite = migratedSqlite();
	db = d1(sqliteD1(sqlite));
	sqlite.exec(`
		INSERT INTO users (id, username, email) VALUES
			('me', 'me', 'me@example.com'), ('ann', 'ann', 'ann@example.com'), ('bob', 'bob', NULL);
		INSERT INTO boards (id, user_id, name, alias, sort_order, is_public, github_repo) VALUES
			('b0000000-0000-4000-8000-000000000001', 'me', 'Mine', 'mine', 2, 0, 'acme/app'),
			('b0000000-0000-4000-8000-000000000002', 'ann', 'beta', 'beta', 1, 0, NULL),
			('b0000000-0000-4000-8000-000000000003', 'ann', 'Invited', 'invited', 1, 0, NULL),
			('b0000000-0000-4000-8000-000000000004', 'ann', 'Public', 'public', 1, 1, NULL),
			('b0000000-0000-4000-8000-000000000005', 'ann', 'Private', 'private', 1, 0, NULL);
		INSERT INTO board_members (id, board_id, user_id, role) VALUES
			('m1', 'b0000000-0000-4000-8000-000000000001', 'me', 'owner'), ('m2', 'b0000000-0000-4000-8000-000000000002', 'ann', 'owner'),
			('m3', 'b0000000-0000-4000-8000-000000000002', 'me', 'viewer');
		INSERT INTO board_invitations (id, board_id, inviter_id, invitee_email, role) VALUES
			('i1', 'b0000000-0000-4000-8000-000000000003', 'ann', 'me@example.com', 'editor');
		INSERT INTO labels (id, board_id, name, color) VALUES ('l1', 'b0000000-0000-4000-8000-000000000001', 'Bug', '#f00');`);
});

const run = (name: OpName, input: unknown, userId = 'me') =>
	runOp(name, { userId, db: async () => ({}) as never, d1: db }, ops[name].input.parse(input));

async function status(promise: Promise<unknown>) {
	try {
		await promise;
		return 200;
	} catch (e) {
		if (e instanceof OpError) return e.status;
		throw e;
	}
}

describe('getBoards / getBoard', () => {
	it('lists owned, member and invited boards in switcher order, never strangers’ public ones', async () => {
		const boards = (await run('getBoards', {})) as { alias: string }[];
		expect(boards.map((b) => b.alias)).toEqual(['beta', 'invited', 'mine']);
	});

	it('returns the BoardFields shape, with github rebuilt from github_repo', async () => {
		const board = (await run('getBoard', { alias: 'mine' })) as Record<string, unknown>;
		expect(board).toMatchObject({
			id: 'b0000000-0000-4000-8000-000000000001',
			github: '{"owner":"acme","repo":"app","full_name":"acme/app"}',
			is_public: false,
			settings: { enable_hour_tracking: false },
			user: { id: 'me', username: 'me', email: 'me@example.com' },
			labels: [{ id: 'l1', name: 'Bug', color: '#f00', board_id: 'b0000000-0000-4000-8000-000000000001' }],
			board_members: [{ user_id: 'me', role: 'owner', user: { username: 'me' } }],
			client: null
		});
		expect(board).not.toHaveProperty('github_repo');
	});

	it('shows a public or invited board by alias, hides a private one', async () => {
		expect(await run('getBoard', { alias: 'public' })).toMatchObject({ id: 'b0000000-0000-4000-8000-000000000004' });
		expect(await run('getBoard', { alias: 'invited' })).toMatchObject({ id: 'b0000000-0000-4000-8000-000000000003' });
		expect(await run('getBoard', { alias: 'private' })).toBeNull();
		expect(await run('getBoard', { alias: 'nope' })).toBeNull();
	});
});

describe('createBoard', () => {
	it('adds a numeric suffix to a taken alias and makes the caller owner, in one batch', async () => {
		sqlite.exec(`INSERT INTO boards (id, user_id, name, alias) VALUES ('x', 'ann', 'M', 'mine7')`);
		const board = (await run('createBoard', { name: 'Mine' })) as Record<string, unknown>;
		expect(board).toMatchObject({ name: 'Mine', alias: 'mine8', sort_order: 0 });
		expect(board.board_members).toMatchObject([{ user_id: 'me', role: 'owner' }]);
	});

	it('handles a name longer than the 50-byte LIKE cap', async () => {
		const name = 'A very long board name that is well past fifty bytes in length';
		const first = (await run('createBoard', { name })) as { alias: string };
		const second = (await run('createBoard', { name })) as { alias: string };
		expect(second.alias).toBe(`${first.alias}1`);
	});
});

describe('updateBoard / deleteBoard', () => {
	it('a viewer may not edit; an owner sets github and archived_at', async () => {
		expect(await status(run('updateBoard', { id: 'b0000000-0000-4000-8000-000000000002', set: { name: 'x' } }))).toBe(403);
		const github = JSON.stringify({ owner: 'o', repo: 'r', full_name: 'o/r' });
		const archived = '2026-11-13T12:00:00+02:00';
		const board = await run('updateBoard', {
			id: 'b0000000-0000-4000-8000-000000000001',
			set: { github, archived_at: archived }
		});
		expect(board).toMatchObject({ github, archived_at: '2026-11-13T10:00:00.000Z' });
		expect(sqlite.prepare(`SELECT github_repo FROM boards WHERE id = 'b0000000-0000-4000-8000-000000000001'`).get()).toEqual({
			github_repo: 'o/r'
		});
	});

	it('only the owner deletes, and it cascades', async () => {
		expect(await status(run('deleteBoard', { id: 'b0000000-0000-4000-8000-000000000002' }))).toBe(403);
		expect(await run('deleteBoard', { id: 'b0000000-0000-4000-8000-000000000001' })).toEqual({ deleted: true });
		expect(sqlite.prepare(`SELECT count(*) AS n FROM labels`).get()).toEqual({ n: 0 });
	});
});

it('an op without a D1 version answers 501 instead of reading Hasura', async () => {
	expect(await status(run('getLists', { boardId: '11111111-1111-4111-8111-111111111111' }))).toBe(
		501
	);
});

describe('signUp (the users insert triggers)', () => {
	it('picks a free username, makes the first board and its owner row', async () => {
		const { signUp } = await import('../signUp');
		sqlite.exec(`INSERT INTO users (id, username) VALUES ('x1', 'ann1'), ('x2', 'ann-b')`);
		sqlite.exec(`INSERT INTO boards (id, user_id, name, alias) VALUES ('x3', 'ann', 'A', 'ann1s-board')`);
		const user = await signUp(db, { email: 'Ann@Example.com', name: 'Ann' });
		expect(user).toMatchObject({ username: 'ann2', email: 'Ann@Example.com', name: 'Ann' });
		const boards = sqlite
			.prepare(
				`SELECT b.name, b.alias, m.role FROM boards b JOIN board_members m ON m.board_id = b.id WHERE b.user_id = ?`
			)
			.all(user.id);
		expect(boards).toEqual([{ name: "Ann2's board", alias: 'ann2s-board', role: 'owner' }]);
	});
});
