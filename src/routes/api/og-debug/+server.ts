/** @file src/routes/api/og-debug/+server.ts */
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { isSocialMediaBot } from '$lib/server/userAgent';

/**
 * Debug endpoint to help troubleshoot OG tag issues
 * Usage: /api/og-debug?url=/en/username/board
 */
export async function GET({ url, request }: RequestEvent) {
	const testUrl = url.searchParams.get('url') || '/en/test/test-board';
	const userAgent = request.headers.get('user-agent');

	return json({
		info: 'OG Tag Debugging Tool',
		usage: {
			description: 'Test your board URLs',
			examples: [
				'/api/og-debug?url=/en/yourUsername/yourBoard',
				'/api/og-debug?url=/en/yourUsername/yourBoard?card=cardAlias'
			]
		},
		currentRequest: {
			userAgent,
			isBotDetected: isSocialMediaBot(userAgent),
			testUrl
		},
		instructions: {
			step1: 'Make sure you have a board in your database',
			step2: 'Get the board alias (URL-friendly name)',
			step3: 'Use format: /[lang]/[username]/[boardAlias]',
			step4: 'Add ?og-preview=true to bypass authentication',
			exampleUrl: 'http://localhost:5173/en/test/tests-board?og-preview=true'
		},
		routes: {
			boardPage: '/[lang]/[username]/[board]',
			cardModal: '/[lang]/[username]/[board]?card=[cardAlias]',
			ogImageApi: '/[lang]/[username]/[board]/og-image.png',
			testBotAccess: '/api/test-bot-access'
		}
	});
}
