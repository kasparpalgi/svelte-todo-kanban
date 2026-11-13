/** @file src/lib/server/password.ts */
import { serverRequest } from '$lib/graphql/server-client';
import {
	CREATE_PASSWORD_USER,
	GET_PASSWORD_USER,
	SET_PASSWORD_HASH,
	VERIFY_USER_PASSWORD
} from '$lib/graphql/documents';
import { checkPbkdf2, hashPbkdf2, isPbkdf2 } from './pbkdf2';

/**
 * Password sign-in without bcrypt in the app: a bcrypt compare in JS (~86 ms) would blow
 * the 10 ms Workers Free budget (#217). Old bcrypt hashes are still checked by Postgres
 * (pgcrypto) and replaced with a PBKDF2 hash on the next good sign-in, so every active
 * user has a hash the Worker can check itself before Postgres goes away (#226, #245).
 */
export type PasswordUser = {
	id: string;
	name?: string | null;
	email?: string | null;
	username?: string | null;
	image?: string | null;
};

/** Best effort: a failed re-hash must never block the sign-in that triggered it. */
async function rehash(id: string, password: string) {
	try {
		await serverRequest(SET_PASSWORD_HASH, { id, password: await hashPbkdf2(password) });
	} catch (error) {
		console.error('[password] re-hash to PBKDF2 failed:', error);
	}
}

/** The user whose email and password match, or null. */
export async function verifyUserPassword(email: string, password: string) {
	const { users } = await serverRequest(GET_PASSWORD_USER, { email });
	const row = users[0];
	if (!row?.password) return null;
	const { password: hash, ...user } = row;
	if (isPbkdf2(hash)) return (await checkPbkdf2(password, hash)) ? (user as PasswordUser) : null;

	const data = await serverRequest(VERIFY_USER_PASSWORD, { email, password });
	const found = (data.verify_user_password[0] as PasswordUser | undefined) ?? null;
	if (found) await rehash(found.id, password);
	return found;
}

/** Create a user (Postgres runs the username and first-board triggers), stored as PBKDF2. */
export async function createPasswordUser(email: string, name: string, password: string) {
	const data = await serverRequest(CREATE_PASSWORD_USER, { email, name, password });
	const user = data.create_password_user[0] as PasswordUser | undefined;
	if (!user) throw new Error('Failed to create user');
	await rehash(user.id, password);
	return user;
}
