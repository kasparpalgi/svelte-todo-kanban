/** @file src/routes/api/keys/+server.ts
 * Saves a free user's bring-your-own API keys (#194): OpenAI and Cloudflare R2.
 * Keys are encrypted server-side (crypto.ts) before being stored in
 * settings.tokens.{openai,r2}, because the `settings` column is world-readable
 * through the user select permission. The client never sees the raw stored value.
 */
import { json } from '@sveltejs/kit';
import { encryptToken } from '$lib/utils/crypto';
import { serverRequest } from '$lib/graphql/server-client';
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

export const POST: RequestHandler = async ({ request, locals }) => {
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
		const tokens: Record<string, any> = { ...(settings.tokens ?? {}) };

		if ('openai' in body) {
			if (body.openai && body.openai.trim()) {
				tokens.openai = { encrypted: encryptToken(body.openai.trim()) };
			} else {
				delete tokens.openai;
			}
		}

		if ('r2' in body) {
			const r2 = body.r2;
			if (
				r2 &&
				r2.accountId &&
				r2.accessKeyId &&
				r2.secretAccessKey &&
				r2.bucket &&
				r2.publicBaseUrl
			) {
				tokens.r2 = {
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
			} else {
				delete tokens.r2;
			}
		}

		settings.tokens = tokens;

		await serverRequest<unknown, { userId: string; settings: Record<string, any> }>(
			`mutation UpdateSettingsForKeys($userId: uuid!, $settings: jsonb!) {
				update_users_by_pk(pk_columns: { id: $userId }, _set: { settings: $settings }) { id }
			}`,
			{ userId, settings }
		);

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
