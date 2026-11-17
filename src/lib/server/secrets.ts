/** @file src/lib/server/secrets.ts */
// A user's server-only tokens. Hasura keeps them in `users.settings.tokens`; D1 in
// `user_secrets`, one row per name (#232). Both read back as `{ github: {…}, r2: {…} }`.
import { eq } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import { user_secrets } from '$lib/server/db/schema';

export type Tokens = Record<string, Record<string, any> | undefined>;

export async function secretsOf(d1: D1, userId: string): Promise<Tokens> {
	const rows = await d1
		.select({ name: user_secrets.name, value: user_secrets.value })
		.from(user_secrets)
		.where(eq(user_secrets.user_id, userId));
	return Object.fromEntries(rows.map((r) => [r.name, r.value]));
}
