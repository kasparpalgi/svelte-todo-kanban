/** @file src/lib/server/ops/d1/signUp.ts */
// A new user on D1: what three Postgres triggers did on `users` insert —
// set_username_on_insert, create_user_board and board_creator_as_owner — in one batch.
// The Auth.js D1 adapter's createUser calls this.
import { and, sql } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import { firstBoardName, nextFree, prefixRange, usernameBase } from '$lib/server/db/rules';
import { users } from '$lib/server/db/schema';
import { boardAlias, insertBoard } from './boards';

type NewUser = typeof users.$inferInsert & { email: string };

/** A username no user has: the email's local part, plus a number when taken. */
export async function freeUsername(d1: D1, email: string) {
	const base = usernameBase(email);
	const [from, to] = prefixRange(base);
	const taken = await d1
		.select({ username: users.username })
		.from(users)
		.where(and(sql`${users.username} >= ${from}`, sql`${users.username} < ${to}`));
	return nextFree(
		base,
		taken.map((r) => r.username)
	);
}

export async function signUp(d1: D1, user: Omit<NewUser, 'username'>) {
	const id = user.id ?? crypto.randomUUID();
	const username = await freeUsername(d1, user.email);
	const name = firstBoardName(username);
	const alias = await boardAlias(d1, name);
	const [[created]] = await d1.batch([
		d1
			.insert(users)
			.values({ ...user, id, username })
			.returning(),
		...insertBoard(d1, { id: crypto.randomUUID(), user_id: id, name, alias })
	]);
	return created;
}
