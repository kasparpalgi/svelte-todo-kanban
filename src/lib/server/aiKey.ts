/** @file src/lib/server/aiKey.ts
 * Resolves which OpenAI key an AI request may use (#194):
 *  - paid plan  -> the app's own key from .env (OPENAI_API_KEY)
 *  - free plan  -> the user's own key, stored encrypted in settings.tokens.openai
 * Free users without a key get a 402 telling them to add one or upgrade.
 */
import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { decryptToken } from '$lib/utils/crypto';
import { getPlanContext } from '$lib/server/plan';

type Locals = { auth: () => Promise<{ user?: { id?: string } } | null> };

export interface AiKeyResult {
	apiKey?: string;
	/** Ready-to-return error response when a key cannot be resolved. */
	errorResponse?: Response;
}

/**
 * Resolve the OpenAI key for the authenticated user. Returns `{ apiKey }` on
 * success, or `{ errorResponse }` (already a Response) to return directly.
 */
export async function resolveOpenAiKey(locals: Locals): Promise<AiKeyResult> {
	const session = await locals.auth();
	const userId = session?.user?.id;
	if (!userId) {
		return { errorResponse: json({ error: 'Not authenticated' }, { status: 401 }) };
	}

	const ctx = await getPlanContext(userId);
	if (!ctx) {
		return { errorResponse: json({ error: 'User not found' }, { status: 401 }) };
	}

	if (ctx.isPaid) {
		if (!OPENAI_API_KEY) {
			return { errorResponse: json({ error: 'AI service not configured' }, { status: 500 }) };
		}
		return { apiKey: OPENAI_API_KEY };
	}

	// Free plan: use the user's own encrypted key.
	const encrypted = ctx.settings?.tokens?.openai?.encrypted;
	if (encrypted) {
		try {
			const key = decryptToken(encrypted);
			if (key) return { apiKey: key };
		} catch {
			// fall through to the "add a key" response
		}
	}

	return {
		errorResponse: json(
			{
				error:
					'AI features on the free plan need your own OpenAI API key. Add it in Settings, or upgrade to the paid plan.',
				upsell: 'ai'
			},
			{ status: 402 }
		)
	};
}
