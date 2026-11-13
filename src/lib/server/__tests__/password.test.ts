/** @file src/lib/server/__tests__/password.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import {
	CREATE_PASSWORD_USER,
	GET_PASSWORD_USER,
	SET_PASSWORD_HASH,
	VERIFY_USER_PASSWORD
} from '$lib/graphql/documents';
import { createPasswordUser, verifyUserPassword } from '../password';
import { checkPbkdf2, hashPbkdf2, isPbkdf2 } from '../pbkdf2';

vi.mock('$lib/graphql/server-client');

const user = { id: 'u1', name: 'Ann', email: 'ann@x.io', username: 'ann', image: null };
const bcrypt = '$2b$10$abcdefghijklmnopqrstuv';

/** Answers each document the way Hasura would. */
function hasura(stored: string | null, bcryptOk = false) {
	vi.mocked(serverRequest).mockImplementation((async (doc: unknown) => {
		if (doc === GET_PASSWORD_USER) return { users: [{ ...user, password: stored }] };
		if (doc === VERIFY_USER_PASSWORD) return { verify_user_password: bcryptOk ? [user] : [] };
		if (doc === SET_PASSWORD_HASH) return { update_users_by_pk: { id: user.id } };
		if (doc === CREATE_PASSWORD_USER) return { create_password_user: [user] };
		throw new Error('unexpected document');
	}) as never);
}

const writes = () =>
	vi.mocked(serverRequest).mock.calls.filter(([doc]) => doc === SET_PASSWORD_HASH);

describe('pbkdf2', () => {
	it('round-trips and rejects a wrong password', async () => {
		const hash = await hashPbkdf2('secret', 1_000);
		expect(hash).toMatch(/^pbkdf2\$1000\$[^$]+\$[^$]+$/);
		expect(isPbkdf2(hash)).toBe(true);
		expect(await checkPbkdf2('secret', hash)).toBe(true);
		expect(await checkPbkdf2('Secret', hash)).toBe(false);
	});

	it('salts every hash and never matches a malformed one', async () => {
		expect(await hashPbkdf2('a', 1_000)).not.toBe(await hashPbkdf2('a', 1_000));
		expect(await checkPbkdf2('a', 'pbkdf2$x$y$z')).toBe(false);
		expect(await checkPbkdf2('a', 'pbkdf2$1000$')).toBe(false);
		expect(isPbkdf2(bcrypt)).toBe(false);
	});
});

describe('verifyUserPassword', () => {
	beforeEach(() => vi.clearAllMocks());

	it('checks a PBKDF2 hash itself, without Postgres', async () => {
		hasura(await hashPbkdf2('pw', 1_000));
		expect(await verifyUserPassword('ann@x.io', 'pw')).toEqual(user);
		expect(await verifyUserPassword('ann@x.io', 'bad')).toBeNull();
		expect(serverRequest).not.toHaveBeenCalledWith(VERIFY_USER_PASSWORD, expect.anything());
		expect(writes()).toHaveLength(0);
	});

	it('checks bcrypt in Postgres, then stores a PBKDF2 hash', async () => {
		hasura(bcrypt, true);
		expect(await verifyUserPassword('ann@x.io', 'pw')).toEqual(user);
		expect(serverRequest).toHaveBeenCalledWith(VERIFY_USER_PASSWORD, {
			email: 'ann@x.io',
			password: 'pw'
		});
		const [[, vars]] = writes() as [[unknown, { id: string; password: string }]];
		expect(vars.id).toBe('u1');
		expect(await checkPbkdf2('pw', vars.password)).toBe(true);
	});

	it('does not re-hash on a wrong bcrypt password', async () => {
		hasura(bcrypt, false);
		expect(await verifyUserPassword('ann@x.io', 'bad')).toBeNull();
		expect(writes()).toHaveLength(0);
	});

	it('returns null for an unknown email or a user without a password', async () => {
		vi.mocked(serverRequest).mockResolvedValue({ users: [] });
		expect(await verifyUserPassword('no@x.io', 'pw')).toBeNull();
		hasura(null);
		expect(await verifyUserPassword('ann@x.io', 'pw')).toBeNull();
	});

	it('still signs in when the re-hash write fails', async () => {
		hasura(bcrypt, true);
		const answer = vi.mocked(serverRequest).getMockImplementation()!;
		vi.mocked(serverRequest).mockImplementation((async (doc: unknown, vars: unknown) => {
			if (doc === SET_PASSWORD_HASH) throw new Error('down');
			return answer(doc as never, vars as never);
		}) as never);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(await verifyUserPassword('ann@x.io', 'pw')).toEqual(user);
	});
});

describe('createPasswordUser', () => {
	beforeEach(() => vi.clearAllMocks());

	it('creates the user in Postgres and stores a PBKDF2 hash', async () => {
		hasura(null);
		expect(await createPasswordUser('ann@x.io', 'Ann', 'pw')).toEqual(user);
		expect(serverRequest).toHaveBeenCalledWith(CREATE_PASSWORD_USER, {
			email: 'ann@x.io',
			name: 'Ann',
			password: 'pw'
		});
		expect(writes()).toHaveLength(1);
	});

	it('throws when nothing is returned', async () => {
		vi.mocked(serverRequest).mockResolvedValue({ create_password_user: [] });
		await expect(createPasswordUser('a@x.io', 'A', 'pw')).rejects.toThrow('Failed to create user');
	});

	it('passes on a taken-email error', async () => {
		vi.mocked(serverRequest).mockRejectedValue(new Error('Uniqueness violation'));
		await expect(createPasswordUser('a@x.io', 'A', 'pw')).rejects.toThrow('Uniqueness');
	});
});
