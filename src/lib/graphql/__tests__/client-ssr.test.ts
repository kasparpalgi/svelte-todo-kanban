/** @file src/lib/graphql/__tests__/client-ssr.test.ts
 * Runs in the node/server project (browser === false via the $app/environment mock),
 * exercising the SSR branch of getJWTToken: on the server the module-level token
 * cache must NEVER be shared across requests, or one user's token leaks into another
 * user's SSR render. Each request must mint a token bound to its own fetchFn.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { request } from '../client';

function makeToken(userId: string): string {
	const payload = {
		'https://hasura.io/jwt/claims': { 'x-hasura-user-id': userId },
		sub: userId,
		exp: Math.floor((Date.now() + 3600_000) / 1000)
	};
	const encode = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64');
	return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
}

/** A per-request token endpoint stub that records the Authorization header the
 * subsequent GraphQL POST was sent with. */
function makeRequestFetch(userId: string, seen: { auth: string | null }) {
	return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		const jsonHeaders = { 'content-type': 'application/json' };
		if (url.includes('/api/auth/token')) {
			return new Response(JSON.stringify({ token: makeToken(userId) }), {
				status: 200,
				headers: jsonHeaders
			});
		}
		const headers = new Headers(init?.headers);
		seen.auth = headers.get('authorization');
		return new Response(JSON.stringify({ data: { ok: true } }), {
			status: 200,
			headers: jsonHeaders
		});
	}) as unknown as typeof globalThis.fetch;
}

describe('getJWTToken SSR isolation (browser === false)', () => {
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it('mints a fresh token per request and never reuses another request’s token', async () => {
		const seenA = { auth: null as string | null };
		const seenB = { auth: null as string | null };
		const fetchA = makeRequestFetch('user-A', seenA);
		const fetchB = makeRequestFetch('user-B', seenB);

		// graphql-request performs the GraphQL POST via globalThis.fetch; route it
		// to whichever per-request stub is active so each call is fully isolated.
		globalThis.fetch = fetchA;
		await request('query Q { ok }', {}, undefined, fetchA);

		globalThis.fetch = fetchB;
		await request('query Q { ok }', {}, undefined, fetchB);

		// Each request authenticated with ITS OWN user's token — no shared-cache leak.
		expect(seenA.auth).toContain(makeToken('user-A').split('.')[1]);
		expect(seenB.auth).toContain(makeToken('user-B').split('.')[1]);
		expect(seenA.auth).not.toEqual(seenB.auth);

		// Both requests hit the token endpoint (distinct fetchFn = distinct request).
		const tokenHits = (fn: any) =>
			fn.mock.calls.filter((c: any[]) => String(c[0]).includes('/api/auth/token')).length;
		expect(tokenHits(fetchA)).toBe(1);
		expect(tokenHits(fetchB)).toBe(1);
	});

	it('reuses one token across multiple request() calls that share a request fetch', async () => {
		const seen = { auth: null as string | null };
		const fetchOne = makeRequestFetch('user-A', seen);
		globalThis.fetch = fetchOne;

		// Same request-scoped fetch → the token is minted once and reused.
		await request('query Q { ok }', {}, undefined, fetchOne);
		await request('query Q { ok }', {}, undefined, fetchOne);
		await request('query Q { ok }', {}, undefined, fetchOne);

		const tokenHits = (fetchOne as any).mock.calls.filter((c: any[]) =>
			String(c[0]).includes('/api/auth/token')
		).length;
		expect(tokenHits).toBe(1);
	});
});
