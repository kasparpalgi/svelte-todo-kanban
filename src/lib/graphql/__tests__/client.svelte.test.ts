/** @file src/lib/graphql/__tests__/client.svelte.test.ts */
import { describe, it, expect, beforeEach } from 'vitest';
import { ensureTokenForUser } from '../client';

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

describe('ensureTokenForUser', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('keeps a cached token that matches the active user', () => {
		const token = makeToken('user-1');
		localStorage.setItem(TOKEN_LS_KEY, JSON.stringify({ token, expiresAt: Date.now() + 60000 }));

		ensureTokenForUser('user-1');

		expect(localStorage.getItem(TOKEN_LS_KEY)).not.toBeNull();
	});

	it('discards a cached token minted for a different user', () => {
		const token = makeToken('user-1');
		localStorage.setItem(TOKEN_LS_KEY, JSON.stringify({ token, expiresAt: Date.now() + 60000 }));

		ensureTokenForUser('user-2');

		expect(localStorage.getItem(TOKEN_LS_KEY)).toBeNull();
	});

	it('is a no-op when there is no active user id', () => {
		const token = makeToken('user-1');
		localStorage.setItem(TOKEN_LS_KEY, JSON.stringify({ token, expiresAt: Date.now() + 60000 }));

		ensureTokenForUser(null);

		expect(localStorage.getItem(TOKEN_LS_KEY)).not.toBeNull();
	});
});
