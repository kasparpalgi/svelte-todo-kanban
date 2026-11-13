/** @file src/routes/invite/[token]/invite.server.test.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load } from './+page.server';

// The page runs the acceptInvitation op with the admin client: route it by operation.
vi.mock('$lib/graphql/server-client', () => ({ serverRequest: vi.fn() }));
vi.mock('$lib/server/topBoardPath', () => ({
	getTopBoardPath: vi.fn(),
	userLocale: vi.fn(async () => 'en')
}));

import { serverRequest } from '$lib/graphql/server-client';
import { getTopBoardPath } from '$lib/server/topBoardPath';

const db = vi.mocked(serverRequest);
const mockedTopBoard = vi.mocked(getTopBoardPath);
const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];
const calls = () => db.mock.calls.map((c) => opName(c[0]));

/** Run the load and capture the thrown SvelteKit redirect. */
async function runLoad(args: unknown): Promise<{ status: number; location: string }> {
	try {
		await load(args as Parameters<typeof load>[0]);
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
			return { status: e.status as number, location: e.location as string };
		}
		throw e;
	}
	throw new Error('Expected load() to redirect');
}

const invitedSession = { user: { id: 'user-123', email: 'invitee@example.com' } };
const locals = (session: unknown) => ({ auth: vi.fn().mockResolvedValue(session) });

const pendingInvitation = {
	id: 'inv-1',
	board_id: 'board-1',
	role: 'editor',
	status: 'pending',
	invitee_email: 'invitee@example.com',
	expires_at: '2099-01-01T00:00:00Z',
	board: { id: 'board-1', name: 'Team Board', alias: 'team-board', user: { username: 'owner' } }
};

function routeDb(invitationRows: unknown[]) {
	db.mockImplementation((async (doc: unknown) => {
		const op = opName(doc);
		if (op === 'GetUserIdentity')
			return { users_by_pk: { email: 'invitee@example.com', username: 'invitee' } };
		if (op === 'GetInvitation') return { board_invitations: invitationRows };
		if (op === 'AcceptInvitation') return {};
		throw new Error(`unexpected ${op}`);
	}) as typeof serverRequest);
}

describe('invite/[token] load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedTopBoard.mockResolvedValue(null);
	});

	it('redirects an anonymous visitor to sign-in, preserving the token', async () => {
		const result = await runLoad({ params: { token: 'tok 1' }, locals: locals(null) });
		expect(result).toEqual({ status: 302, location: '/signin?invite=tok%201' });
		expect(db).not.toHaveBeenCalled();
	});

	it('accepts a matching pending invitation and redirects to the board', async () => {
		routeDb([pendingInvitation]);
		const result = await runLoad({ params: { token: 'tok-1' }, locals: locals(invitedSession) });

		expect(result.location).toBe('/en/owner/team-board');
		const accept = db.mock.calls.find((c) => opName(c[0]) === 'AcceptInvitation');
		expect(accept?.[1]).toEqual({
			id: 'inv-1',
			member: { board_id: 'board-1', user_id: 'user-123', role: 'editor' }
		});
	});

	it('does not re-accept an already accepted invitation', async () => {
		routeDb([{ ...pendingInvitation, status: 'accepted' }]);
		const result = await runLoad({ params: { token: 'tok-1' }, locals: locals(invitedSession) });

		expect(result.location).toBe('/en/owner/team-board');
		expect(calls()).not.toContain('AcceptInvitation');
	});

	it('falls back to the top board when no invitation matches the account', async () => {
		routeDb([]);
		mockedTopBoard.mockResolvedValue('/en/owner/other-board');
		const result = await runLoad({ params: { token: 'tok-1' }, locals: locals(invitedSession) });

		expect(result.location).toBe('/en/owner/other-board');
		expect(calls()).not.toContain('AcceptInvitation');
	});

	it('does not accept an expired invitation', async () => {
		routeDb([{ ...pendingInvitation, expires_at: '2020-01-01T00:00:00Z' }]);
		const result = await runLoad({ params: { token: 'tok-1' }, locals: locals(invitedSession) });

		expect(result.location).toBe('/en');
		expect(calls()).not.toContain('AcceptInvitation');
	});

	it('falls back to the locale root when nothing else resolves', async () => {
		routeDb([]);
		const result = await runLoad({ params: { token: 'tok-1' }, locals: locals(invitedSession) });
		expect(result.location).toBe('/en');
	});
});
