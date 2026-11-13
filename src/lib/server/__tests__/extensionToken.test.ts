/** @file src/lib/server/__tests__/extensionToken.test.ts */
import { describe, it, expect, vi } from 'vitest';
import { SignJWT } from 'jose';

const SECRET = 's'.repeat(32);
vi.mock('$env/dynamic/private', () => ({ env: { AUTH_SECRET: SECRET } }));
const { extensionUserId } = await import('../extensionToken');

const sign = (secret = SECRET, exp = '1h') =>
	new SignJWT({})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject('user-1')
		.setExpirationTime(exp)
		.sign(new TextEncoder().encode(secret));

const req = (token: string) =>
	new Request('http://x', { headers: { authorization: `Bearer ${token}` } });

describe('extensionUserId', () => {
	it('reads the user from a valid token on an extension op', async () => {
		expect(await extensionUserId(req(await sign()), 'getBoards')).toBe('user-1');
	});

	it('opens no other op', async () => {
		expect(await extensionUserId(req(await sign()), 'deleteBoard')).toBeNull();
	});

	it('rejects a forged or expired token', async () => {
		expect(await extensionUserId(req(await sign('x'.repeat(32))), 'getNotes')).toBeNull();
		expect(await extensionUserId(req(await sign(SECRET, '-1m')), 'getNotes')).toBeNull();
		expect(await extensionUserId(new Request('http://x'), 'getNotes')).toBeNull();
	});
});
