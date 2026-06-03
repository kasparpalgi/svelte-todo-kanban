/** @file src/lib/utils/__tests__/getTopBoardPath.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requestMock = vi.fn();
vi.mock('$lib/graphql/client', () => ({
	request: (...args: unknown[]) => requestMock(...args)
}));

import { getTopBoardPath } from '../getTopBoardPath';

type Vars = {
	where?: Record<string, any>;
	[key: string]: any;
};

const fetchStub = (() => Promise.resolve(new Response())) as unknown as typeof globalThis.fetch;

const ownBoard = { alias: 'my-board', user: { username: 'alice' } };
const memberBoard = { alias: 'team-board', user: { username: 'bob' } };
const publicBoard = { alias: 'ftwbihs-board', user: { username: 'ftwbihs' } };

/** Routes a mocked request() call to a response based on its variables. */
function routeRequest(
	vars: Vars,
	{
		locale = 'en',
		own = [] as any[],
		member = [] as any[],
		byAlias = [] as any[]
	}: { locale?: string; own?: any[]; member?: any[]; byAlias?: any[] }
) {
	const where = vars?.where ?? {};
	if (where.id) return { users: [{ locale }] }; // GET_USERS
	if (where.alias) return { boards: byAlias }; // GET_BOARDS by lastBoardAlias
	if (where.user_id) return { boards: own }; // own boards
	if (where.board_members) return { boards: member }; // member boards
	return { boards: [] };
}

describe('getTopBoardPath', () => {
	beforeEach(() => {
		requestMock.mockReset();
	});

	it('returns null without a user id (no misdirect to public boards)', async () => {
		// Even if a public board exists, an unauthenticated/idless session gets nothing.
		requestMock.mockImplementation((_doc, vars) =>
			Promise.resolve(routeRequest(vars as Vars, { own: [publicBoard] }))
		);

		const path = await getTopBoardPath({ user: {} }, fetchStub);
		expect(path).toBeNull();
	});

	it('redirects to the last visited board when set', async () => {
		const session = { user: { id: 'u1', settings: { lastBoardAlias: 'my-board' } } };
		requestMock.mockImplementation((_doc, vars) =>
			Promise.resolve(routeRequest(vars as Vars, { locale: 'et', byAlias: [ownBoard] }))
		);

		const path = await getTopBoardPath(session, fetchStub);
		expect(path).toBe('/et/alice/my-board');
	});

	it("falls back to the user's own board, not a public board", async () => {
		const session = { user: { id: 'u1' } };
		requestMock.mockImplementation((_doc, vars) =>
			Promise.resolve(routeRequest(vars as Vars, { own: [ownBoard] }))
		);

		const path = await getTopBoardPath(session, fetchStub);
		expect(path).toBe('/en/alice/my-board');

		// The fallback must scope by user_id — never an unfiltered/public query.
		const boardWheres = requestMock.mock.calls
			.map((c) => (c[1] as Vars)?.where)
			.filter((w): w is Record<string, any> => !!w && !w.id);
		expect(boardWheres.length).toBeGreaterThan(0);
		for (const w of boardWheres) {
			expect(w.user_id || w.board_members || w.alias).toBeTruthy();
		}
	});

	it('falls back to a member board when the user owns none', async () => {
		const session = { user: { id: 'u1' } };
		requestMock.mockImplementation((_doc, vars) =>
			Promise.resolve(routeRequest(vars as Vars, { own: [], member: [memberBoard] }))
		);

		const path = await getTopBoardPath(session, fetchStub);
		expect(path).toBe('/en/bob/team-board');
	});

	it('returns null for a brand-new user with no boards', async () => {
		const session = { user: { id: 'new-user' } };
		requestMock.mockImplementation((_doc, vars) =>
			Promise.resolve(routeRequest(vars as Vars, { own: [], member: [] }))
		);

		const path = await getTopBoardPath(session, fetchStub);
		expect(path).toBeNull();
	});

	it('returns null and does not throw when a request fails', async () => {
		const session = { user: { id: 'u1' } };
		requestMock.mockRejectedValue(new Error('network down'));

		const path = await getTopBoardPath(session, fetchStub);
		expect(path).toBeNull();
	});
});
