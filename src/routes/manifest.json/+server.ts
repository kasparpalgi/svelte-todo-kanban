import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	// TODO: const user = locals.auth.;

	const baseManifest = {
		short_name: 'ToDzz',
		name: 'ToDzz',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		theme_color: '#19183B',
		background_color: '#A1C2BD',
		icons: [
			{
				src: '/pwa-192x192.png',
				sizes: '192x192',
				type: 'image/png'
			},
			{
				src: '/pwa-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any'
			},
			{
				src: '/pwa-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable'
			}
		],
		shortcuts: []
	};

	if (user?.boards) {
		baseManifest.shortcuts = user.boards.slice(0, 4).map((board: any) => ({
			name: `Quick Add to ${board.name}`,
			short_name: board.name,
			description: `Add items to ${board.name}`,
			url: `/en/${user.username}/${board.alias}/mobile-add`,
			icons: [
				{
					src: '/pwa-192x192.png',
					sizes: '192x192',
					type: 'image/png'
				}
			]
		}));
	}

	return json(baseManifest, {
		headers: {
			'Content-Type': 'application/manifest+json',
			'Cache-Control': 'public, max-age=600' // 10min
		}
	});
};
