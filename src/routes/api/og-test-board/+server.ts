/** @file src/routes/api/og-test-board/+server.ts */
import { json, type RequestEvent } from '@sveltejs/kit';
import { isSocialMediaBot } from '$lib/server/userAgent';

/**
 * Simple test to verify bot detection and preview mode work
 */
export async function GET({ url, request }: RequestEvent) {
	const userAgent = request.headers.get('user-agent');
	const isBot = isSocialMediaBot(userAgent);
	const isPreviewMode = url.searchParams.get('og-preview') === 'true';

	return json({
		userAgent,
		isBot,
		isPreviewMode,
		wouldAllowAccess: isBot || isPreviewMode,
		message: isBot || isPreviewMode
			? '✅ Would allow access (bot or preview mode detected)'
			: '❌ Would redirect to signin'
	});
}
