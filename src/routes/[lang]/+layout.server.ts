/** @file src/routes/[lang]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getTopBoardPath } from '$lib/utils/getTopBoardPath';
import { publicRequest } from '$lib/graphql/client';
import { GET_URL_SHORTCUT_BY_ALIAS, INCREMENT_URL_SHORTCUT_VISITS } from '$lib/graphql/documents';
import { RESERVED_ALIASES, normalizeTargetUrl } from '$lib/utils/shortcutAlias';

const KNOWN_LANGUAGES = new Set(['en', 'cs', 'et']);

interface ShortcutLookupResult {
	url_shortcuts: Array<{ alias: string; target_url: string }>;
}

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals, fetch } = event;

	const pathSegments = url.pathname.split('/').filter(Boolean);
	const isSingleSegment = pathSegments.length === 1;
	const segment = isSingleSegment ? pathSegments[0] : null;

	// URL shortcut redirect: single-segment path that's not a language code or reserved route
	if (
		isSingleSegment &&
		segment &&
		!KNOWN_LANGUAGES.has(segment) &&
		!RESERVED_ALIASES.has(segment.toLowerCase())
	) {
		try {
			console.log('[shortcut] lookup', { segment });
			const data = await publicRequest<ShortcutLookupResult>(GET_URL_SHORTCUT_BY_ALIAS, {
				alias: segment
			});
			console.log('[shortcut] lookup result', { rows: data.url_shortcuts?.length ?? 0 });
			const hit = data.url_shortcuts?.[0];
			if (hit?.target_url) {
				try {
					console.log('[shortcut] incrementing visits', { alias: hit.alias });
					const incResult = await publicRequest<{
						update_url_shortcuts?: { affected_rows: number } | null;
					}>(INCREMENT_URL_SHORTCUT_VISITS, { alias: hit.alias });
					console.log('[shortcut] increment response', {
						affected_rows: incResult.update_url_shortcuts?.affected_rows ?? null
					});
				} catch (incErr: any) {
					console.warn('[shortcut] visit increment failed', {
						message: incErr?.message,
						response: incErr?.response,
						errors: incErr?.response?.errors
					});
				}
				throw redirect(302, normalizeTargetUrl(hit.target_url));
			}
		} catch (err) {
			// Re-throw redirect; swallow lookup errors so we fall through to normal routing
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}
			console.warn('[layout.server] shortcut lookup failed', err);
		}
	}

	const session = await locals.auth();

	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		throw redirect(302, `/signin`);
	}

	const isLanguageRootOnly = isSingleSegment && segment === params.lang;

	if (session && isLanguageRootOnly) {
		const topBoardPath = await getTopBoardPath(session, fetch);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		}
	}

	return {
		session
	};
};
