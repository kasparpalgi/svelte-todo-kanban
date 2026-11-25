/** @file src/routes/api/keys/+server.ts
 * Saves a free user's bring-your-own API keys (#194): OpenAI and Cloudflare R2.
 * Keys are encrypted server-side (crypto.ts) before being stored in
 * settings.tokens.{openai,r2} (Hasura) or user_secrets rows (D1), because the `settings` column is world-readable
 * through the user select permission. The client never sees the raw stored value.
 */
import { json } from '@sveltejs/kit';
import { encryptToken } from '$lib/utils/crypto';
import { serverRequest } from '$lib/graphql/server-client';
import { opCtx } from '$lib/server/ops/run';
import { dropSecret, putSecret, secretsOf } from '$lib/server/secrets';
import type { RequestHandler } from './$types';

interface R2Input {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	publicBaseUrl: string;
}

interface KeysBody {
	/** OpenAI key string to set, or null/'' to remove. Omit to leave unchanged. */
	openai?: string | null;
	/** R2 credentials to set, or null to remove. Omit to leave unchanged. */
	r2?: R2Input | null;
}

/** The encrypted R2 token, or null when the input is incomplete (= remove). */
function r2Token(r2: R2Input | null | undefined): Record<string, unknown> | null {
	if (!r2?.accountId || !r2.accessKeyId || !r2.secretAccessKey || !r2.bucket || !r2.publicBaseUrl) {
		return null;
	}
	return {
		encrypted: encryptToken(
			JSON.stringify({
				accountId: r2.accountId.trim(),
				accessKeyId: r2.accessKeyId.trim(),
				secretAccessKey: r2.secretAccessKey.trim(),
				bucket: r2.bucket.trim(),
				publicBaseUrl: r2.publicBaseUrl.trim()
			})
		)
	};
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const session = await locals.auth();
	const userId = session?.user?.id;
	if (!userId) {
		return json({ success: false, error: 'Not authenticated' }, { status: 401 });
	}

	let body: KeysBody;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid request body' }, { status: 400 });
	}

	try {
		// `undefined` = leave alone, `null` = remove, object = set.
		const next: Partial<Record<'openai' | 'r2', Record<string, unknown> | null>> = {};
		if ('openai' in body) {
			next.openai = body.openai?.trim() ? { encrypted: encryptToken(body.openai.trim()) } : null;
		}
		if ('r2' in body) next.r2 = r2Token(body.r2);

		const ctx = opCtx(userId, platform);
		let tokens: Record<string, any>;
		if (ctx.d1) {
			for (const [name, value] of Object.entries(next)) {
				if (value) await putSecret(ctx.d1, userId, name, value);
				else if (value === null) await dropSecret(ctx.d1, userId, name);
			}
			tokens = await secretsOf(ctx.d1, userId);
		} else {
			// Read current settings so we merge rather than clobber other tokens.
			const current = await serverRequest<
				{ users_by_pk: { settings: Record<string, any> | null } | null },
				{ userId: string }
			>(
				`query GetSettingsForKeys($userId: uuid!) {
					users_by_pk(id: $userId) { settings }
				}`,
				{ userId }
			);
			const settings: Record<string, any> = { ...(current.users_by_pk?.settings ?? {}) };
			tokens = { ...(settings.tokens ?? {}) };
			for (const [name, value] of Object.entries(next)) {
				if (value) tokens[name] = value;
				else if (value === null) delete tokens[name];
			}
			settings.tokens = tokens;

			await serverRequest<unknown, { userId: string; settings: Record<string, any> }>(
				`mutation UpdateSettingsForKeys($userId: uuid!, $settings: jsonb!) {
					update_users_by_pk(pk_columns: { id: $userId }, _set: { settings: $settings }) { id }
				}`,
				{ userId, settings }
			);
		}

		return json({
			success: true,
			openaiSet: !!tokens.openai,
			r2Set: !!tokens.r2
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to save keys';
		console.error('Save keys error:', error);
		return json({ success: false, error: message }, { status: 500 });
	}
};
