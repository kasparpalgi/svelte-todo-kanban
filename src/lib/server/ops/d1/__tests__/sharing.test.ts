/** @file src/lib/server/ops/d1/__tests__/sharing.test.ts */
// The D1 list, label, member and invitation ops on a real migrated SQLite: the access
// rules of their Hasura ops, and the board stamp the poll reads (#241).
import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { d1, type D1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { ops, type OpName } from '../../index';
import { OpError } from '../../op';
import { runOp } from '../../run';

const B = (n: number) => `b0000000-0000-4000-8000-00000000000${n}`;
const L = (n: number) => `10000000-0000-4000-8000-00000000000${n}`;
const M = (n: number) => `30000000-0000-4000-8000-00000000000${n}`;
const I = (n: number) => `40000000-0000-4000-8000-00000000000${n}`;
const OLD = '2026-01-01T00:00:00.000Z';

let sqlite: DatabaseSync;
let db: D1;

beforeEach(() => {
	sqlite = migratedSqlite();
	db = d1(sqliteD1(sqlite));
	sqlite.exec(`
		INSERT INTO users (id, username, email) VALUES
			('me', 'me', 'me@example.com'), ('ann', 'ann', 'ann@example.com'), ('bob', 'bob', NULL);
		INSERT INTO boards (id, user_id, name, alias, is_public, github_repo, changed_at) VALUES
			('${B(1)}', 'me', 'Mine', 'mine', 0, 'acme/app', '${OLD}'),
			('${B(2)}', 'ann', 'Shared', 'shared', 0, NULL, '${OLD}'),
			('${B(3)}', 'ann', 'Public', 'public', 1, NULL, '${OLD}'),
			('${B(4)}', 'ann', 'Private', 'private', 0, NULL, '${OLD}');
		INSERT INTO board_members (id, board_id, user_id, role, created_at) VALUES
			('${M(1)}', '${B(1)}', 'me', 'owner', '2026-01-01T00:00:00.000Z'),
			('${M(2)}', '${B(2)}', 'ann', 'owner', '2026-01-01T00:00:00.000Z'),
			('${M(3)}', '${B(2)}', 'me', 'viewer', '2026-01-02T00:00:00.000Z');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES
			('${L(1)}', '${B(1)}', 'b-todo', 1), ('${L(2)}', '${B(1)}', 'A-todo', 1),
			('${L(3)}', '${B(2)}', 'Shared', 0), ('${L(4)}', '${B(3)}', 'Public', 0),
			('${L(5)}', '${B(4)}', 'Private', 0);
		INSERT INTO labels (id, board_id, name, color) VALUES
			('${L(6)}', '${B(1)}', 'Bug', '#f00'), ('${L(7)}', '${B(2)}', 'Ann', '#0f0');`);
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

const changedAt = (id: string) =>
	(sqlite.prepare(`SELECT changed_at FROM boards WHERE id = ?`).get(id) as { changed_at: string })
		.changed_at;

describe('lists', () => {
	it('getLists: own and member boards, plus a readable boardId, in sort then name order', async () => {
		const ids = async (input: object) =>
			((await run('getLists', input)) as { id: string }[]).map((l) => l.id);
		expect(await ids({})).toEqual([L(3), L(2), L(1)]);
		expect(await ids({ boardId: B(3) })).toEqual([L(4), L(3), L(2), L(1)]);
		expect(await ids({ boardId: B(4) })).toEqual([L(3), L(2), L(1)]);
	});

	it('returns the ListFields shape, with board.github rebuilt', async () => {
		const [list] = (await run('getLists', {})) as unknown[];
		expect(list).toMatchObject({ id: L(3), board: { alias: 'shared', github: null } });
		const mine = ((await run('getLists', {})) as { board: unknown }[])[1];
		expect(mine.board).toEqual({
			id: B(1),
			name: 'Mine',
			alias: 'mine',
			sort_order: 1,
			github: '{"owner":"acme","repo":"app","full_name":"acme/app"}'
		});
	});

	it('create, update and delete stamp the board; a viewer gets 403', async () => {
		expect(await status(run('createList', { boardId: B(2), name: 'x' }))).toBe(403);
		const list = (await run('createList', { boardId: B(1), name: 'New' })) as { id: string };
		expect(list).toMatchObject({ name: 'New', sort_order: 0, board_id: B(1) });
		expect(changedAt(B(1))).not.toBe(OLD);

		expect(await status(run('updateList', { id: list.id, set: { board_id: B(4) } }))).toBe(403);
		expect(await run('updateList', { id: list.id, set: { name: 'Renamed' } })).toMatchObject({
			name: 'Renamed'
		});
		expect(await run('deleteList', { id: list.id })).toEqual({ deleted: true });
		expect(await status(run('deleteList', { id: list.id }))).toBe(404);
	});
});

describe('labels', () => {
	it('an editor manages them and stamps the board; a viewer gets 403', async () => {
		expect(await status(run('createLabel', { boardId: B(2), name: 'x', color: '#000' }))).toBe(403);
		expect(await status(run('updateLabel', { id: L(7), set: { name: 'x' } }))).toBe(403);
		const label = (await run('createLabel', { boardId: B(1), name: 'Feat', color: '#00f' })) as {
			id: string;
		};
		expect(label).toMatchObject({ name: 'Feat', color: '#00f', sort_order: 0, board_id: B(1) });
		expect(changedAt(B(1))).not.toBe(OLD);
		expect(await run('updateLabel', { id: label.id, set: { color: '#111' } })).toMatchObject({
			color: '#111'
		});
		expect(await run('deleteLabel', { id: label.id })).toEqual({ deleted: true });
		expect(await status(run('deleteLabel', { id: label.id }))).toBe(404);
	});
});

describe('members', () => {
	it('readers see them oldest first; only the owner changes roles; a member may leave', async () => {
		const members = (await run('getBoardMembers', { boardId: B(2) })) as unknown[];
		expect(members).toMatchObject([
			{ user_id: 'ann', role: 'owner', user: { username: 'ann', email: 'ann@example.com' } },
			{ user_id: 'me', role: 'viewer' }
		]);
		expect(await status(run('getBoardMembers', { boardId: B(4) }))).toBe(403);
		expect(await status(run('updateBoardMember', { id: M(3), role: 'editor' }))).toBe(403);
		expect(await run('updateBoardMember', { id: M(3), role: 'editor' }, 'ann')).toMatchObject({
			role: 'editor'
		});
		expect(await status(run('removeBoardMember', { id: M(2) }))).toBe(403);
		expect(await run('removeBoardMember', { id: M(3) })).toEqual({ deleted: true });
	});
});

describe('invitations', () => {
	const invite = (invitee: string, role = 'editor', boardId = B(1)) =>
		run('createBoardInvitation', { boardId, invitee, role }) as Promise<{
			id: string;
			token: string;
		}>;

	it('only the owner invites, by email or username, with a URL-safe token', async () => {
		expect(await status(invite('bob', 'viewer', B(2)))).toBe(403);
		const byName = await invite('bob');
		expect(byName).toMatchObject({
			invitee_username: 'bob',
			invitee_email: null,
			status: 'pending',
			inviter: { id: 'me', username: 'me' },
			board: { id: B(1), name: 'Mine', alias: 'mine' }
		});
		expect(byName.token).toMatch(/^[0-9a-f]{32}$/);
		expect(await invite('ann@example.com')).toMatchObject({ invitee_email: 'ann@example.com' });
		expect(await run('getBoardInvitations', { boardId: B(1) })).toHaveLength(2);
		expect(await status(run('getBoardInvitations', { boardId: B(3) }))).toBe(403);
	});

	it('the invitee sees it, accepts by token (twice is fine) and joins with the role', async () => {
		const { token } = await invite('ann@example.com', 'viewer');
		expect(await run('getMyInvitations', {}, 'ann')).toHaveLength(1);
		expect(await run('getMyInvitations', {}, 'bob')).toEqual([]);
		expect(await status(run('acceptInvitation', { token }, 'bob'))).toBe(404);

		const board = { id: B(1), name: 'Mine', alias: 'mine', user: { username: 'me' } };
		expect(await run('acceptInvitation', { token }, 'ann')).toEqual(board);
		expect(await run('acceptInvitation', { token }, 'ann')).toEqual(board);
		expect(
			sqlite
				.prepare(`SELECT role FROM board_members WHERE board_id = ? AND user_id = 'ann'`)
				.get(B(1))
		).toEqual({ role: 'viewer' });
		expect(await run('getMyInvitations', {}, 'ann')).toEqual([]);
	});

	it('an owner who accepts stays owner; expired, declined and cancelled ones are refused', async () => {
		sqlite.exec(`
			INSERT INTO board_invitations (id, board_id, inviter_id, invitee_email, role, expires_at) VALUES
				('${I(1)}', '${B(2)}', 'me', 'ann@example.com', 'viewer', '2099-01-01T00:00:00.000Z'),
				('${I(2)}', '${B(1)}', 'me', 'ann@example.com', 'viewer', '2020-01-01T00:00:00.000Z'),
				('${I(3)}', '${B(1)}', 'me', 'ann@example.com', 'editor', '2099-01-01T00:00:00.000Z');`);
		await run('acceptInvitation', { id: I(1) }, 'ann');
		expect(sqlite.prepare(`SELECT role FROM board_members WHERE id = ?`).get(M(2))).toEqual({
			role: 'owner'
		});
		expect(await status(run('acceptInvitation', { id: I(2) }, 'ann'))).toBe(400);
		expect(await run('declineInvitation', { id: I(3) }, 'ann')).toEqual({ declined: true });
		expect(await status(run('acceptInvitation', { id: I(3) }, 'ann'))).toBe(400);

		expect(await status(run('cancelInvitation', { id: I(3) }, 'ann'))).toBe(403);
		expect(await run('cancelInvitation', { id: I(3) })).toEqual({ deleted: true });
		expect(await status(run('cancelInvitation', { id: I(3) }))).toBe(404);
	});
});
