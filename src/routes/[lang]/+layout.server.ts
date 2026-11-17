/** @file src/routes/[lang]/+layout.server.ts */
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { RESERVED_ALIASES, normalizeTargetUrl } from '$lib/utils/shortcutAlias';
import { isAdminEmail } from '$lib/server/admin';

const KNOWN_LANGUAGES = new Set(['en', 'cs', 'et']);

export const load: LayoutServerLoad = async (event) => {
	const { params, url, locals } = event;

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
		let target: string | null = null;
		try {
			const { opCtx } = await import('$lib/server/ops/run');
			const { followShortcut } = await import('$lib/server/shortcut');
			target = await followShortcut(opCtx(null, event.platform), segment);
		} catch (err) {
			// Fall through to normal routing
			console.warn('[layout.server] shortcut lookup failed', err);
		}
		if (target) throw redirect(302, normalizeTargetUrl(target));
	}

	const session = await locals.auth();

	if (!session && !url.pathname.includes('/signin') && !url.pathname.includes('/api/auth')) {
		throw redirect(302, `/signin`);
	}

	const isLanguageRootOnly = isSingleSegment && segment === params.lang;

	if (session && isLanguageRootOnly) {
		// Lazy for the same reason as in the root layout (#236)
		const [{ getTopBoardPath }, { opCtx }] = await Promise.all([
			import('$lib/server/topBoardPath'),
			import('$lib/server/ops/run')
		]);
		const topBoardPath = await getTopBoardPath(opCtx(null, event.platform), session);
		if (topBoardPath) {
			throw redirect(302, topBoardPath);
		}
	}

	return {
		session,
		isAdmin: isAdminEmail(session?.user?.email)
	};
};
