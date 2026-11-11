/** @file src/lib/server/__tests__/password.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import { CREATE_PASSWORD_USER, VERIFY_USER_PASSWORD } from '$lib/graphql/documents';
import { createPasswordUser, verifyUserPassword } from '../password';

vi.mock('$lib/graphql/server-client');

const user = { id: 'u1', name: 'Ann', email: 'ann@x.io', username: 'ann', image: null };

describe('password', () => {
	beforeEach(() => vi.clearAllMocks());

	it('verifyUserPassword returns the matching user', async () => {
		vi.mocked(serverRequest).mockResolvedValue({ verify_user_password: [user] });
		expect(await verifyUserPassword('ann@x.io', 'pw')).toEqual(user);
		expect(serverRequest).toHaveBeenCalledWith(VERIFY_USER_PASSWORD, {
			email: 'ann@x.io',
			password: 'pw'
		});
	});

	it('verifyUserPassword returns null on a wrong password or unknown email', async () => {
		vi.mocked(serverRequest).mockResolvedValue({ verify_user_password: [] });
		expect(await verifyUserPassword('ann@x.io', 'bad')).toBeNull();
	});

	it('createPasswordUser sends the plain password for Postgres to hash', async () => {
		vi.mocked(serverRequest).mockResolvedValue({ create_password_user: [user] });
		expect(await createPasswordUser('ann@x.io', 'Ann', 'pw')).toEqual(user);
		expect(serverRequest).toHaveBeenCalledWith(CREATE_PASSWORD_USER, {
			email: 'ann@x.io',
			name: 'Ann',
			password: 'pw'
		});
	});

	it('createPasswordUser throws when nothing is returned', async () => {
		vi.mocked(serverRequest).mockResolvedValue({ create_password_user: [] });
		await expect(createPasswordUser('a@x.io', 'A', 'pw')).rejects.toThrow('Failed to create user');
	});

	it('createPasswordUser passes on a taken-email error', async () => {
		vi.mocked(serverRequest).mockRejectedValue(new Error('Uniqueness violation'));
		await expect(createPasswordUser('a@x.io', 'A', 'pw')).rejects.toThrow('Uniqueness');
	});
});
