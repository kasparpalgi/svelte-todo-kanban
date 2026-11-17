/** @file src/lib/server/auth/d1.ts */
// Auth.js on D1 (#259): `@auth/d1-adapter`, except that a new user goes through `signUp()`
// (username, first board and its owner row, one batch) and `deleteUser` skips the adapter's
// `sessions` table, which doesn't exist: sessions are JWTs. Password sign-in checks PBKDF2
// only; a user still on bcrypt has no hash the Worker can check and uses the email link.
import { D1Adapter } from '@auth/d1-adapter';
import type { Adapter, AdapterUser } from '@auth/core/adapters';
import type { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { d1 } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { signUp } from '$lib/server/ops/d1/signUp';
import type { PasswordUser } from '$lib/server/password';
import { checkPbkdf2, hashPbkdf2, isPbkdf2 } from '$lib/server/pbkdf2';

type Row = typeof users.$inferSelect;

const adapterUser = ({ id, name, email, emailVerified, image, username }: Row) =>
	({
		id,
		name,
		email: email ?? '',
		emailVerified: emailVerified ? new Date(emailVerified) : null,
		image,
		username
	}) as AdapterUser;

const passwordUser = ({ id, name, email, username, image }: Row): PasswordUser => ({
	id,
	name,
	email,
	username,
	image
});

export function d1Auth(binding: D1Database) {
	const db = d1(binding);

	const adapter: Adapter = {
		...D1Adapter(binding),
		async createUser({ id, name, email, emailVerified, image }) {
			const user = { id, name, email, emailVerified: emailVerified?.toISOString(), image };
			return adapterUser(await signUp(db, user));
		},
		// The accounts rows go with it (ON DELETE CASCADE).
		async deleteUser(id) {
			await db.delete(users).where(eq(users.id, id));
		}
	};

	/** The user whose email and PBKDF2 hash match, or null (also for a bcrypt hash). */
	async function verifyUserPassword(email: string, password: string) {
		const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (!row || !isPbkdf2(row.password)) return null;
		return (await checkPbkdf2(password, row.password!)) ? passwordUser(row) : null;
	}

	/** A new user with a PBKDF2 hash. Throws on a taken email (the unique index). */
	async function createPasswordUser(email: string, name: string, password: string) {
		return passwordUser(await signUp(db, { email, name, password: await hashPbkdf2(password) }));
	}

	return { adapter, verifyUserPassword, createPasswordUser };
}
