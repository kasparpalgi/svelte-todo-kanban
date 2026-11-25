import { env } from '$env/dynamic/private';
import { PUBLIC_APP_ENV, PUBLIC_APP_URL } from '$env/static/public';
import { UPDATE_USER } from '$lib/graphql/documents';
import { redirect } from '@sveltejs/kit';
import { encryptToken } from '$lib/utils/crypto';
import { serverRequest } from '$lib/graphql/server-client';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema';
import { opCtx } from '$lib/server/ops/run';
import { putSecret, secretsOf } from '$lib/server/secrets';
import { googleFetch } from '$lib/server/google';
import type { RequestEvent } from './$types';

interface GoogleTokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	scope: string;
	token_type: string;
	error?: string;
	error_description?: string;
}

interface GetUserResult {
	users_by_pk?: {
		id: string;
		email?: string;
		settings?: any;
	};
}

export async function GET({ url, platform }: RequestEvent) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	console.log('Google Calendar callback received:', { hasCode: !!code, hasState: !!state });

	if (!state) {
		console.error('Missing state parameter');
		throw redirect(302, '/settings?error=missing_user_id');
	}

	if (!code) {
		console.error('Missing code parameter');
		throw redirect(302, '/settings?error=google_calendar_auth_failed');
	}

	try {
		const redirectUri =
			PUBLIC_APP_ENV === 'development'
				? 'http://localhost:5173/api/google-calendar/callback'
				: `${PUBLIC_APP_URL}/api/google-calendar/callback`;

		console.log('Exchanging code for tokens with redirect_uri:', redirectUri);

		// Exchange code for tokens
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				code,
				client_id: env.AUTH_GOOGLE_ID,
				client_secret: env.AUTH_GOOGLE_SECRET,
				redirect_uri: redirectUri,
				grant_type: 'authorization_code'
			})
		});

		const tokenData: GoogleTokenResponse = await tokenResponse.json();

		console.log('Token response:', {
			hasAccessToken: !!tokenData.access_token,
			hasRefreshToken: !!tokenData.refresh_token,
			error: tokenData.error,
			errorDescription: tokenData.error_description
		});

		if (!tokenData.access_token || tokenData.error) {
			throw new Error(
				tokenData.error_description || tokenData.error || 'Failed to get access token'
			);
		}

		// Encrypt the tokens
		const encryptedAccessToken = encryptToken(tokenData.access_token);
		const encryptedRefreshToken = tokenData.refresh_token
			? encryptToken(tokenData.refresh_token)
			: undefined;

		console.log('Fetching user data for userId:', state);

		// Current calendar token (for its calendar id) and the user's email
		const ctx = opCtx(state, platform);
		let found: { email?: string | null; settings?: any } | null | undefined;
		let existing: Record<string, any> | undefined;
		if (ctx.d1) {
			[found] = await ctx.d1.select({ email: users.email }).from(users).where(eq(users.id, state));
			existing = (await secretsOf(ctx.d1, state)).google_calendar;
		} else {
			const userData = await serverRequest<GetUserResult, { userId: string }>(
				`
			query GetUser($userId: uuid!) {
				users_by_pk(id: $userId) {
					id
					email
					settings
				}
			}
		`,
				{ userId: state }
			);
			found = userData.users_by_pk;
			existing = found?.settings?.tokens?.google_calendar;
		}

		if (!found) {
			throw new Error('User not found');
		}

		const currentSettings = found.settings || {};
		const userEmail = found.email || 'Unknown';

		// Create or reuse a dedicated secondary calendar for this app

		let calendarId = existing?.calendar_id;
		if (!calendarId) {
			const newCalendar = await googleFetch(
				tokenData.access_token,
				'https://www.googleapis.com/calendar/v3/calendars',
				{ method: 'POST', body: { summary: 'ToDzz' } }
			);
			calendarId = newCalendar.id;
			console.log('Created ToDzz calendar:', calendarId);
		} else {
			console.log('Reusing existing ToDzz calendar:', calendarId);
		}

		const token = {
			encrypted: encryptedAccessToken,
			refresh_token: encryptedRefreshToken,
			email: userEmail,
			calendar_id: calendarId,
			connectedAt: new Date().toISOString(),
			expires_at: Date.now() + tokenData.expires_in * 1000
		};
		if (ctx.d1) {
			await putSecret(ctx.d1, state, 'google_calendar', token);
		} else {
			await serverRequest(UPDATE_USER, {
				where: { id: { _eq: state } },
				_set: {
					settings: {
						...currentSettings,
						tokens: { ...(currentSettings.tokens || {}), google_calendar: token }
					}
				}
			});
		}
	} catch (error: any) {
		console.error('Google Calendar OAuth error:', error);
		console.error('Error stack:', error.stack);
		throw redirect(
			302,
			`/settings?error=${encodeURIComponent(error.message || 'Failed to connect Google Calendar')}`
		);
	}

	// Outside the try: a thrown redirect would be caught above and turned into an error.
	throw redirect(302, '/settings?connected=google-calendar');
}
