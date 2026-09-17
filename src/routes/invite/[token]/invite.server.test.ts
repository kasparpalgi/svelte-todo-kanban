/** @file src/routes/invite/[token]/invite.server.test.ts */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load } from './+page.server';

// Mock the GraphQL client — route request() by operation name.
vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

// Mock top-board fallback resolution.
vi.mock('$lib/utils/getTopBoardPath', () => ({
	getTopBoardPath: vi.fn()
}));

import { request } from '$lib/graphql/client';
import { getTopBoardPath } from '$lib/utils/getTopBoardPath';

const mockedRequest = vi.mocked(request);
const mockedTopBoard = vi.mocked(getTopBoardPath);

function opName(doc: unknown): string {
	return String(doc);
}

/** Run the load and capture the thrown SvelteKit redirect. */
async function runLoad(args: any): Promise<{ status: number; location: string }> {
	try {
		await load(args);
	} catch (e: any) {
		// SvelteKit redirect() throws a Redirect with status + location.
		if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
			return { status: e.status, location: e.location };
		}
		throw e;
	}
	throw new Error('Expected load() to redirect');
}

const fetch = vi.fn() as any;

const invitedSession = {
	user: { id: 'user-123', email: 'invitee@example.com', username: 'invitee' }
};

const pendingInvitation = {
	id: 'inv-1',
	board_id: 'board-1',
	role: 'editor',
	status: 'pending',
	invitee_email: 'invitee@example.com',
	expires_at: '2099-01-01T00:00:00Z',
	board: { id: 'board-1', name: 'Team Board', alias: 'team-board', user: { username: 'owner' } }
};

/** Default request router: locale query + invitation lookup + mutations. */
function routeRequest(invitationRows: any[]) {
	mockedRequest.mockImplementation(async (doc: unknown) => {
		const s = opName(doc);
		if (s.includes('GetUsers')) return { users: [{ locale: 'en' }] } as any;
		if (s.includes('GetInvitationByToken')) return { board_invitations: invitationRows } as any;
		if (s.includes('AddBoardMember')) return { insert_board_members: { affected_rows: 1 } } as any;
		if (s.includes('UpdateBoardInvitation'))
			return { update_board_invitations: { affected_rows: 1 } } as any;
		return {} as any;
	});
}

describe('invite/[token] load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedTopBoard.mockResolvedValue(null);
	});

	it('redirects an anonymous visitor to sign-in, preserving the token', async () => {
		const locals = { auth: vi.fn().mockResolvedValue(null) };
		const result = await runLoad({ params: { token: 'tok 1' }, locals, fetch });
		expect(result.status).toBe(302);
		expect(result.location).toBe('/signin?invite=tok%201');
		expect(mockedRequest).not.toHaveBeenCalled();
	});

	it('accepts a matching pending invitation and redirects to the board', async () => {
		routeRequest([pendingInvitation]);
		const locals = { auth: vi.fn().mockResolvedValue(invitedSession) };

		const result = await runLoad({ params: { token: 'tok-1' }, locals, fetch });

		expect(result.location).toBe('/en/owner/team-board');

		const calls = mockedRequest.mock.calls.map((c) => opName(c[0]));
		expect(calls.some((c) => c.includes('AddBoardMember'))).toBe(true);
		expect(calls.some((c) => c.includes('UpdateBoardInvitation'))).toBe(true);
	});

	it('does not re-accept an already accepted invitation', async () => {
		routeRequest([{ ...pendingInvitation, status: 'accepted' }]);
		const locals = { auth: vi.fn().mockResolvedValue(invitedSession) };

		const result = await runLoad({ params: { token: 'tok-1' }, locals, fetch });

		expect(result.location).toBe('/en/owner/team-board');
		const calls = mockedRequest.mock.calls.map((c) => opName(c[0]));
		expect(calls.some((c) => c.includes('AddBoardMember'))).toBe(false);
		expect(calls.some((c) => c.includes('UpdateBoardInvitation'))).toBe(false);
	});

	it('falls back to the top board when no invitation matches the account', async () => {
		routeRequest([]);
		mockedTopBoard.mockResolvedValue('/en/owner/other-board');
		const locals = { auth: vi.fn().mockResolvedValue(invitedSession) };

		const result = await runLoad({ params: { token: 'tok-1' }, locals, fetch });

		expect(result.location).toBe('/en/owner/other-board');
		const calls = mockedRequest.mock.calls.map((c) => opName(c[0]));
		expect(calls.some((c) => c.includes('AddBoardMember'))).toBe(false);
	});

	it('falls back to the locale root when nothing else resolves', async () => {
		routeRequest([]);
		mockedTopBoard.mockResolvedValue(null);
		const locals = { auth: vi.fn().mockResolvedValue(invitedSession) };

		const result = await runLoad({ params: { token: 'tok-1' }, locals, fetch });

		expect(result.location).toBe('/en');
	});
});
