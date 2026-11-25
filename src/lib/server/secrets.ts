/** @file src/lib/server/secrets.ts */
// A user's server-only tokens. Hasura keeps them in `users.settings.tokens`; D1 in
// `user_secrets`, one row per name (#232). Both read back as `{ github: {…}, r2: {…} }`.
import { and, eq } from 'drizzle-orm';
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

/** Saves one token object under `name`, replacing any earlier one. */
export async function putSecret(
	d1: D1,
	userId: string,
	name: string,
	value: Record<string, unknown>
): Promise<void> {
	await d1
		.insert(user_secrets)
		.values({ user_id: userId, name, value })
		.onConflictDoUpdate({
			target: [user_secrets.user_id, user_secrets.name],
			set: { value, updated_at: new Date().toISOString() }
		});
}

/** Removes the row `name` (what `disconnectIntegration` deletes). */
export async function dropSecret(d1: D1, userId: string, name: string): Promise<void> {
	await d1
		.delete(user_secrets)
		.where(and(eq(user_secrets.user_id, userId), eq(user_secrets.name, name)));
}
