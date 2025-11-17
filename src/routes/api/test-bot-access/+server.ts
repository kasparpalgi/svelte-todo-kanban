/** @file src/routes/api/test-bot-access/+server.ts */
import { json, type RequestEvent } from '@sveltejs/kit';
import { isSocialMediaBot } from '$lib/server/userAgent';

/**
 * Test endpoint to verify bot detection
 * Usage: curl http://localhost:5173/api/test-bot-access -H "User-Agent: facebookexternalhit/1.1"
 */
export async function GET({ request }: RequestEvent) {
	const userAgent = request.headers.get('user-agent');
	const isBot = isSocialMediaBot(userAgent);

	return json({
		userAgent,
		isBot,
		message: isBot ? 'Would allow access (bot detected)' : 'Would redirect to signin (not a bot)'
	});
}
