/** @file src/routes/[lang]/[username]/[board]/+page.server.ts */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS, GET_TODOS } from '$lib/graphql/documents';
import type { GetBoardsQuery, GetTodosQuery } from '$lib/graphql/generated/graphql';
import { PUBLIC_APP_URL } from '$env/static/public';
import { isSocialMediaBot } from '$lib/server/userAgent';

export const load: PageServerLoad = async ({ locals, url, params, fetch, request: req }) => {
	const session = await locals.auth();
	const userAgent = req.headers.get('user-agent');
	const isBot = isSocialMediaBot(userAgent);

	// Allow bots through for OG tag scraping, but require auth for real users
	if (!session && !isBot) {
		throw redirect(302, '/signin');
	}

	const { username, board: boardAlias, lang } = params;
	const cardAlias = url.searchParams.get('card');

	// Fetch board data for OG tags
	let ogData: {
		title: string;
		description: string;
		image: string | null;
		url: string;
	} | null = null;

	const pageUrl = `${PUBLIC_APP_URL}/${lang}/${username}/${boardAlias}`;

	// For bots, provide basic OG data with the logo
	// They can't authenticate, so we skip the GraphQL queries
	if (isBot) {
		if (cardAlias) {
			ogData = {
				title: `Card on ${boardAlias} | ToDzz`,
				description: `View this card on ${username}'s board`,
				image: `${PUBLIC_APP_URL}/pwa-512x512.png`, // Use app icon
				url: `${pageUrl}?card=${cardAlias}`
			};
		} else {
			ogData = {
				title: `${boardAlias} Board | ToDzz`,
				description: `View ${username}'s board on ToDzz`,
				image: `${PUBLIC_APP_URL}/pwa-512x512.png`, // Use app icon
				url: pageUrl
			};
		}

		return {
			session: null,
			ogData
		};
	}

	// For authenticated users, fetch actual data
	try {
		// Fetch boards
		const boardsData = await request<GetBoardsQuery>(
			GET_BOARDS,
			{
				where: { alias: { _eq: boardAlias } }
			},
			{},
			fetch
		);

		const board = boardsData.boards?.[0];

		if (board) {
			if (cardAlias) {
				// Fetch specific card for OG tags
				const todosData = await request<GetTodosQuery>(
					GET_TODOS,
					{
						where: { alias: { _eq: cardAlias } }
					},
					{},
					fetch
				);

				const todo = todosData.todos?.[0];

				if (todo) {
					// Check if card has uploaded images
					const firstImage = todo.uploads?.[0]?.url;

					ogData = {
						title: todo.title || 'Card',
						description: todo.content?.substring(0, 200) || 'View this card',
						image: firstImage || null, // Will use screenshot if null
						url: `${pageUrl}?card=${cardAlias}`
					};
				}
			} else {
				// Board OG tags
				ogData = {
					title: board.name || 'Board',
					description: `View ${board.name} board`,
					image: null, // Will use screenshot
					url: pageUrl
				};
			}
		}
	} catch (error) {
		console.error('Failed to fetch OG data:', error);
		// Fallback to app icon if data fetch fails
		ogData = {
			title: `${boardAlias} | ToDzz`,
			description: 'Kanban board on ToDzz',
			image: `${PUBLIC_APP_URL}/pwa-512x512.png`,
			url: pageUrl
		};
	}

	return {
		session,
		ogData
	};
};
