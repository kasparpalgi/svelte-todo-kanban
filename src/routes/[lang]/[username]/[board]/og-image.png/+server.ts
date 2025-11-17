/** @file src/routes/[lang]/[username]/[board]/og-image.png/+server.ts */
import { error, type RequestEvent } from '@sveltejs/kit';
import { request } from '$lib/graphql/client';
import { GET_BOARDS, GET_TODOS } from '$lib/graphql/documents';
import type { GetBoardsQuery, GetTodosQuery } from '$lib/graphql/generated/graphql';

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * Generates a simple SVG-based OG image for boards/cards
 * This is a fallback when no uploaded images are available
 */
function generateFallbackImage(options: {
	type: 'card' | 'board';
	title: string;
	description?: string;
}): Buffer {
	const { type, title, description } = options;

	// Create a simple SVG image
	const svg = `
		<svg width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
				</linearGradient>
			</defs>

			<!-- Background -->
			<rect width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" fill="url(#bg)"/>

			<!-- Content -->
			<g>
				<!-- Icon -->
				<rect x="50" y="100" width="80" height="80" rx="12" fill="white" opacity="0.2"/>
				<text x="90" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="48" fill="white" text-anchor="middle">
					${type === 'card' ? '📝' : '📋'}
				</text>

				<!-- Title -->
				<text x="600" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">
					${escapeXml(title.substring(0, 40))}${title.length > 40 ? '...' : ''}
				</text>

				${
					description
						? `
				<!-- Description -->
				<text x="600" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="white" opacity="0.9" text-anchor="middle">
					${escapeXml(description.substring(0, 60))}${description.length > 60 ? '...' : ''}
				</text>
				`
						: ''
				}

				<!-- App Name -->
				<text x="600" y="550" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="white" opacity="0.7" text-anchor="middle">
					ToDzz
				</text>
			</g>
		</svg>
	`;

	return Buffer.from(svg);
}

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * GET endpoint to serve OG image
 * - For cards with images: redirects to first uploaded image
 * - For cards without images / boards: generates a fallback SVG image
 */
export async function GET({ url, params, fetch: fetchFn }: RequestEvent) {
	const { username, board: boardAlias, lang } = params;
	const type = url.searchParams.get('type') as 'card' | 'board' | null;
	const cardAlias = url.searchParams.get('cardAlias');

	if (!type || !username || !boardAlias) {
		throw error(400, 'Missing required parameters');
	}

	if (type === 'card' && !cardAlias) {
		throw error(400, 'Card alias required for card images');
	}

	try {
		// Fetch board data
		const boardsData = await request<GetBoardsQuery>(
			GET_BOARDS,
			{
				where: { alias: { _eq: boardAlias } }
			},
			{},
			fetchFn
		);

		const board = boardsData.boards?.[0];

		if (!board) {
			throw error(404, 'Board not found');
		}

		if (type === 'card' && cardAlias) {
			// Fetch card data
			const todosData = await request<GetTodosQuery>(
				GET_TODOS,
				{
					where: { alias: { _eq: cardAlias } }
				},
				{},
				fetchFn
			);

			const todo = todosData.todos?.[0];

			if (!todo) {
				throw error(404, 'Card not found');
			}

			// Check if card has uploaded images
			const firstImage = todo.uploads?.[0]?.url;

			if (firstImage) {
				// Redirect to the first uploaded image
				return new Response(null, {
					status: 302,
					headers: {
						Location: firstImage,
						'Cache-Control': 'public, max-age=86400'
					}
				});
			}

			// Generate fallback image for card
			const imageBuffer = generateFallbackImage({
				type: 'card',
				title: todo.title || 'Card',
				description: todo.content?.substring(0, 100) || undefined
			});

			return new Response(imageBuffer, {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600'
				}
			});
		} else {
			// Generate fallback image for board
			const imageBuffer = generateFallbackImage({
				type: 'board',
				title: board.name || 'Board',
				description: undefined
			});

			return new Response(imageBuffer, {
				headers: {
					'Content-Type': 'image/svg+xml',
					'Cache-Control': 'public, max-age=3600'
				}
			});
		}
	} catch (err) {
		console.error('OG image generation error:', err);

		// Return a simple error image
		const errorImage = generateFallbackImage({
			type: 'board',
			title: 'ToDzz',
			description: 'Kanban Board'
		});

		return new Response(errorImage, {
			headers: {
				'Content-Type': 'image/svg+xml',
				'Cache-Control': 'public, max-age=300'
			}
		});
	}
}
