/** @file src/lib/server/auth/__tests__/d1.test.ts */
// Auth.js on D1 against a real migrated SQLite, through the real @auth/d1-adapter (#259).
import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { hashPbkdf2 } from '$lib/server/pbkdf2';
import { d1Auth } from '../d1';

let sqlite: DatabaseSync;
let auth: ReturnType<typeof d1Auth>;

beforeEach(() => {
	sqlite = migratedSqlite();
	auth = d1Auth(sqliteD1(sqlite));
});

const rows = (sql: string) => sqlite.prepare(sql).all();

describe('adapter', () => {
	it('createUser runs signUp: username, first board and its owner row', async () => {
		const verified = new Date('2026-11-17T10:00:00.000Z');
		const { adapter } = auth;
		const user = await adapter.createUser!({
			id: 'u1',
			name: 'Ann',
			email: 'ann@example.com',
			emailVerified: verified
		});
		expect(user).toMatchObject({ id: 'u1', email: 'ann@example.com', username: 'ann' });
		expect(user.emailVerified?.toISOString()).toBe(verified.toISOString());
		const [board] = rows('SELECT id, name FROM boards') as { id: string; name: string }[];
		expect(board.name).toBe("Ann's board");
		expect(rows('SELECT user_id, role FROM board_members')).toEqual([
			{ user_id: 'u1', role: 'owner' }
		]);
		expect(await adapter.getUserByEmail!('ann@example.com')).toMatchObject({ id: 'u1' });
	});

	it('links a Google account and finds the user by it', async () => {
		const { adapter } = auth;
		await adapter.createUser!({ id: 'u1', email: 'ann@example.com', emailVerified: null });
		await adapter.linkAccount!({
			userId: 'u1',
			type: 'oidc',
			provider: 'google',
			providerAccountId: 'g-1',
			access_token: 'at'
		});
		expect(
			await adapter.getUserByAccount!({ provider: 'google', providerAccountId: 'g-1' })
		).toMatchObject({ id: 'u1' });
	});

	it('uses an email-link token once', async () => {
		const { adapter } = auth;
		const expires = new Date(Date.now() + 60_000);
		await adapter.createVerificationToken!({ identifier: 'ann@example.com', token: 't', expires });
		const used = await adapter.useVerificationToken!({ identifier: 'ann@example.com', token: 't' });
		expect(used?.expires.getTime()).toBe(expires.getTime());
		expect(
			await adapter.useVerificationToken!({ identifier: 'ann@example.com', token: 't' })
		).toBeNull();
	});

	it('deleteUser removes the user and its accounts without a sessions table', async () => {
		const { adapter } = auth;
		await adapter.createUser!({ id: 'u1', email: 'ann@example.com', emailVerified: null });
		await adapter.linkAccount!({
			userId: 'u1',
			type: 'oidc',
			provider: 'google',
			providerAccountId: 'g-1'
		});
		await adapter.deleteUser!('u1');
		expect(rows('SELECT id FROM users')).toEqual([]);
		expect(rows('SELECT id FROM accounts')).toEqual([]);
	});
});

describe('passwords', () => {
	it('signs up with a PBKDF2 hash, then signs in with it', async () => {
		const user = await auth.createPasswordUser('bob@example.com', 'Bob', 'secret-1');
		expect(user).toMatchObject({ email: 'bob@example.com', name: 'Bob', username: 'bob' });
		expect(rows('SELECT password FROM users')).toEqual([
			{ password: expect.stringMatching(/^pbkdf2\$/) }
		]);
		expect(await auth.verifyUserPassword('bob@example.com', 'secret-1')).toEqual(user);
		expect(await auth.verifyUserPassword('bob@example.com', 'wrong')).toBeNull();
		expect(await auth.verifyUserPassword('nobody@example.com', 'secret-1')).toBeNull();
	});

	it('refuses a taken email', async () => {
		await auth.createPasswordUser('bob@example.com', 'Bob', 'secret-1');
		await expect(auth.createPasswordUser('bob@example.com', 'Bob', 'x')).rejects.toThrow();
	});

	it('a bcrypt hash never signs in: that user takes the email link', async () => {
		sqlite.exec(`INSERT INTO users (id, username, email, password) VALUES
			('old', 'old', 'old@example.com', '$2a$10$abcdefghijklmnopqrstuv')`);
		expect(await auth.verifyUserPassword('old@example.com', 'anything')).toBeNull();
		const hash = await hashPbkdf2('pw');
		sqlite.prepare(`UPDATE users SET password = ? WHERE id = 'old'`).run(hash);
		expect(await auth.verifyUserPassword('old@example.com', 'pw')).toMatchObject({ id: 'old' });
	});
});
