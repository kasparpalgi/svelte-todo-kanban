/** @file src/routes/api/manifest/[lang]/[username]/[board]/mobile-add/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_APP_URL } from '$env/static/public';

export const GET: RequestHandler = ({ params }) => {
	const { lang, username, board } = params;
	const startUrl = `/${lang}/${username}/${board}/mobile-add`;

	const manifest = {
		short_name: 'ToDzz',
		name: `ToDzz – ${board}`,
		start_url: startUrl,
		scope: startUrl,
		display: 'standalone',
		theme_color: '#19183B',
		background_color: '#A1C2BD',
		icons: [
			{
				src: `${PUBLIC_APP_URL}/pwa-192x192.png`,
				sizes: '192x192',
				type: 'image/png'
			},
			{
				src: `${PUBLIC_APP_URL}/pwa-512x512.png`,
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any'
			},
			{
				src: `${PUBLIC_APP_URL}/pwa-512x512.png`,
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			}
		]
	};

	return json(manifest, {
		headers: {
			'Content-Type': 'application/manifest+json',
			'Cache-Control': 'no-cache'
		}
	});
};
