/** @file src/routes/[lang]/[username]/[board]/+page.server.ts */
// Renders only the shell: the browser loads the board and its cards on mount. A signed-in
// render makes no Hasura call, which keeps the page inside Workers Free's 10 ms CPU (#236).
// OG tags are for link-preview bots, which never carry a session cookie.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_APP_URL } from '$env/static/public';
import { isSocialMediaBot } from '$lib/server/userAgent';

export const load: PageServerLoad = async ({ locals, url, params, request }) => {
	const session = await locals.auth();
	if (session) return { session, ogData: null };
	if (!isSocialMediaBot(request.headers.get('user-agent'))) throw redirect(302, '/signin');

	const { username, board: boardAlias, lang } = params;
	const cardAlias = url.searchParams.get('card');
	const pageUrl = `${PUBLIC_APP_URL}/${lang}/${username}/${boardAlias}`;
	const image = `${PUBLIC_APP_URL}/pwa-512x512.png`;

	return {
		session: null,
		ogData: cardAlias
			? {
					title: `Card on ${boardAlias} | ToDzz`,
					description: `View this card on ${username}'s board`,
					image,
					url: `${pageUrl}?card=${cardAlias}`
				}
			: {
					title: `${boardAlias} Board | ToDzz`,
					description: `View ${username}'s board on ToDzz`,
					image,
					url: pageUrl
				}
	};
};
