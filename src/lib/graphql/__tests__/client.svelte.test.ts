/** @file src/lib/graphql/__tests__/client.svelte.test.ts */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ensureTokenForUser, clearTokenCache, request } from '../client';

const TOKEN_LS_KEY = 'app_jwt_cache';

function makeToken(userId: string, expiresInMs = 60 * 60 * 1000): string {
	const header = { alg: 'HS256', typ: 'JWT' };
	const payload = {
		'https://hasura.io/jwt/claims': { 'x-hasura-user-id': userId },
		sub: userId,
		exp: Math.floor((Date.now() + expiresInMs) / 1000)
	};
	const encode = (obj: unknown) => btoa(JSON.stringify(obj));
	return `${encode(header)}.${encode(payload)}.signature`;
}

let tokenUserId = 'user-1';

/**
 * Stub global fetch so both the token endpoint (/api/auth/token) and the
 * graphql-request GraphQL POST are intercepted — no real network in tests.
 * Returns a spy counting how often the token endpoint was hit.
 */
function stubFetch() {
	const jsonHeaders = { 'content-type': 'application/json' };
	const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.includes('/api/auth/token')) {
			return new Response(JSON.stringify({ token: makeToken(tokenUserId) }), {
				status: 200,
				headers: jsonHeaders
			});
		}
		// GraphQL endpoint — return an empty successful payload.
		return new Response(JSON.stringify({ data: { __typename: 'query_root' } }), {
			status: 200,
			headers: jsonHeaders
		});
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

function tokenCallCount(mock: ReturnType<typeof vi.fn>): number {
	return mock.mock.calls.filter((c: any[]) => String(c[0]).includes('/api/auth/token')).length;
}

async function ping() {
	await request('query Ping { __typename }', {}).catch(() => {});
}

describe('token cache identity safety', () => {
	beforeEach(() => {
		tokenUserId = 'user-1';
		clearTokenCache();
		localStorage.clear();
	});

	afterEach(() => {
		clearTokenCache();
		vi.unstubAllGlobals();
	});

	it('reuses the in-memory token for the same active user', async () => {
		const fetchMock = stubFetch();
		await ping();
		ensureTokenForUser('user-1');
		await ping();

		// Same user → token minted once and reused.
		expect(tokenCallCount(fetchMock)).toBe(1);
	});

	it('discards a cached token minted for a different user', async () => {
		const fetchMock = stubFetch();
		await ping();
		ensureTokenForUser('user-2');
		await ping();

		// Different user → cache cleared, token re-minted.
		expect(tokenCallCount(fetchMock)).toBe(2);
	});

	it('is a no-op when there is no active user id', async () => {
		const fetchMock = stubFetch();
		await ping();
		ensureTokenForUser(null);
		await ping();

		expect(tokenCallCount(fetchMock)).toBe(1);
	});

	it('never persists the JWT to localStorage (no cross-login staleness carrier)', async () => {
		stubFetch();
		await ping();
		expect(localStorage.getItem(TOKEN_LS_KEY)).toBeNull();
	});

	it('purges a legacy persisted token when the cache is cleared', () => {
		localStorage.setItem(
			TOKEN_LS_KEY,
			JSON.stringify({ token: makeToken('old-user'), expiresAt: Date.now() + 60000 })
		);

		clearTokenCache();

		expect(localStorage.getItem(TOKEN_LS_KEY)).toBeNull();
	});
});
