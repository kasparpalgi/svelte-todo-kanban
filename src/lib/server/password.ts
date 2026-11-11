/** @file src/lib/server/password.ts */
import { serverRequest } from '$lib/graphql/server-client';
import { CREATE_PASSWORD_USER, VERIFY_USER_PASSWORD } from '$lib/graphql/documents';

/**
 * Postgres (pgcrypto) hashes and checks passwords, so sign-in costs no app CPU — a bcrypt
 * compare in JS (~86 ms) would blow the 10 ms Workers Free budget (#217).
 */
export type PasswordUser = {
	id: string;
	name?: string | null;
	email?: string | null;
	username?: string | null;
	image?: string | null;
};

/** The user whose email and password match, or null. */
export async function verifyUserPassword(email: string, password: string) {
	const data = await serverRequest(VERIFY_USER_PASSWORD, { email, password });
	return (data.verify_user_password[0] as PasswordUser | undefined) ?? null;
}

/** Create a user with a bcrypt-hashed password; throws if the email is taken. */
export async function createPasswordUser(email: string, name: string, password: string) {
	const data = await serverRequest(CREATE_PASSWORD_USER, { email, name, password });
	const user = data.create_password_user[0] as PasswordUser | undefined;
	if (!user) throw new Error('Failed to create user');
	return user;
}
