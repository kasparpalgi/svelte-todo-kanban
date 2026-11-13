/** @file src/lib/server/__tests__/topBoardPath.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/graphql/server-client', () => ({ serverRequest: vi.fn() }));

import { serverRequest } from '$lib/graphql/server-client';
import { getTopBoardPath } from '../topBoardPath';

const db = vi.mocked(serverRequest);
const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

const board = (alias: string, owner: string, members: string[] = []) => ({
	id: `id-${alias}`,
	alias,
	user: { id: owner, username: owner },
	board_members: members.map((user_id) => ({ user_id }))
});

/** Answers the admin client: locale, identity, role, and the board lists. */
function routeDb({
	locale = 'en',
	byAlias = [] as unknown[],
	mine = [] as unknown[],
	role = null as null | { user_id: string; is_public: boolean; board_members: unknown[] }
}) {
	db.mockImplementation((async (doc: unknown, vars: { where?: { alias?: unknown } }) => {
		const op = opName(doc);
		if (op === 'GetUsers') return { users: [{ locale }] };
		if (op === 'GetUserIdentity') return { users_by_pk: { email: null, username: 'u1' } };
		if (op === 'GetBoardRole') return { boards_by_pk: role };
		if (op === 'GetInvitation') return { board_invitations: [] };
		if (op === 'GetBoards') return { boards: vars.where?.alias ? byAlias : mine };
		throw new Error(`unexpected ${op}`);
	}) as typeof serverRequest);
}

describe('getTopBoardPath', () => {
	beforeEach(() => {
		db.mockReset();
	});

	it('returns null without a user id, and asks nothing', async () => {
		expect(await getTopBoardPath({ user: {} })).toBeNull();
		expect(db).not.toHaveBeenCalled();
	});

	it('goes to the last visited board when the user can still see it', async () => {
		routeDb({
			locale: 'et',
			byAlias: [board('my-board', 'alice')],
			role: { user_id: 'u1', is_public: false, board_members: [] }
		});
		const session = { user: { id: 'u1', settings: { lastBoardAlias: 'my-board' } } };
		expect(await getTopBoardPath(session)).toBe('/et/alice/my-board');
	});

	it("skips a last board the user can't see any more", async () => {
		routeDb({ byAlias: [board('gone', 'stranger')], mine: [board('mine', 'u1')] });
		const session = { user: { id: 'u1', settings: { lastBoardAlias: 'gone' } } };
		expect(await getTopBoardPath(session)).toBe('/en/u1/mine');
	});

	it('prefers an own board over a member board, and skips boards only invited to', async () => {
		routeDb({
			mine: [board('invited', 'carol'), board('team', 'bob', ['u1']), board('own', 'u1')]
		});
		expect(await getTopBoardPath({ user: { id: 'u1' } })).toBe('/en/u1/own');
	});

	it('falls back to a member board', async () => {
		routeDb({ mine: [board('invited', 'carol'), board('team', 'bob', ['u1'])] });
		expect(await getTopBoardPath({ user: { id: 'u1' } })).toBe('/en/bob/team');
	});

	it('returns null when the user has no board', async () => {
		routeDb({});
		expect(await getTopBoardPath({ user: { id: 'u1' } })).toBeNull();
	});
});
