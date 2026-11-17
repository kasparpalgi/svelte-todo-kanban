/** @file src/lib/server/auth/__tests__/d1EmailLink.test.ts */
// The whole email-link sign-in through Auth.js itself on D1: send the link, open it, and
// a new user exists with a username and a first board (#259).
import { expect, it } from 'vitest';
import { Auth } from '@auth/core';
import Nodemailer from '@auth/core/providers/nodemailer';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { d1Auth } from '../d1';

it('signs a new user up by email link', async () => {
	const sqlite = migratedSqlite();
	let link = '';
	const config = {
		adapter: d1Auth(sqliteD1(sqlite)).adapter,
		secret: 'test-secret-test-secret-test-secret',
		trustHost: true,
		session: { strategy: 'jwt' as const },
		providers: [
			Nodemailer({
				server: { host: 'localhost' },
				sendVerificationRequest: async ({ url }) => void (link = url)
			})
		]
	};
	const base = 'http://localhost/auth';
	const csrf = await Auth(new Request(`${base}/csrf`), config);
	const { csrfToken } = await csrf.json();
	const cookie = csrf.headers
		.getSetCookie()
		.map((c) => c.split(';')[0])
		.join('; ');
	const sent = await Auth(
		new Request(`${base}/signin/nodemailer`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
			body: new URLSearchParams({ csrfToken, email: 'new@example.com' })
		}),
		config
	);
	expect(sent.status).toBe(302);
	expect(link).toContain('/auth/callback/nodemailer?');

	const opened = await Auth(new Request(link), config);
	expect(opened.headers.get('location')).not.toContain('error');
	expect(opened.headers.getSetCookie().some((c) => c.startsWith('authjs.session-token='))).toBe(
		true
	);
	expect(sqlite.prepare('SELECT username FROM users').all()).toEqual([{ username: 'new' }]);
	expect(sqlite.prepare('SELECT role FROM board_members').all()).toEqual([{ role: 'owner' }]);
	expect(sqlite.prepare('SELECT * FROM verification_tokens').all()).toEqual([]);
});
