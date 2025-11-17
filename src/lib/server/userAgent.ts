/** @file src/lib/server/userAgent.ts */

/**
 * Detects if the user-agent is a social media crawler/bot
 * These bots need access to OG meta tags for link previews
 */
export function isSocialMediaBot(userAgent: string | null): boolean {
	if (!userAgent) return false;

	const botPatterns = [
		// Facebook
		'facebookexternalhit',
		'facebookcatalog',
		'Facebot',

		// Twitter
		'Twitterbot',
		'TweetmemeBot',

		// LinkedIn
		'LinkedInBot',
		'linkedin',

		// Slack
		'Slackbot',
		'Slack-ImgProxy',

		// Discord
		'Discordbot',

		// Telegram
		'TelegramBot',

		// WhatsApp
		'WhatsApp',

		// Other messaging/social
		'SkypeUriPreview',
		'vkShare',
		'Pinterest',
		'redditbot',

		// General crawlers that might be used for previews
		'embedly',
		'quora link preview',
		'showyoubot',
		'outbrain',
		'tumblr',
		'bitlybot'
	];

	const lowerUA = userAgent.toLowerCase();
	return botPatterns.some((pattern) => lowerUA.includes(pattern.toLowerCase()));
}
