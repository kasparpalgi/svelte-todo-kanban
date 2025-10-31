// @file src/routes/api/calendar-event/+server.ts
import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } from '$env/static/private';
import { serverRequest } from '$lib/graphql/server-client';
import { UPDATE_USER } from '$lib/graphql/documents';
import { decryptToken, encryptToken } from '$lib/utils/crypto';
import type { RequestHandler } from './$types';

interface GetUserResult {
	users_by_pk?: {
		id: string;
		settings?: any;
	};
}

async function refreshGoogleToken(refreshToken: string) {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: AUTH_GOOGLE_ID,
			client_secret: AUTH_GOOGLE_SECRET,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		})
	});

	if (!response.ok) {
		throw new Error('Failed to refresh token');
	}

	const data = await response.json();
	return {
		access_token: data.access_token,
		expires_in: data.expires_in
	};
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title, description, dueDate, hasTime, userId } = await request.json();

		console.log('Calendar event request:', { title, dueDate, hasTime, hasUserId: !!userId });

		if (!userId) {
			console.error('No user ID provided');
			return json({ success: false, error: 'Unauthorized - no user ID' }, { status: 401 });
		}

		// Get user settings with calendar token
		const userData = await serverRequest<GetUserResult, { userId: string }>(
			`
			query GetUser($userId: uuid!) {
				users_by_pk(id: $userId) {
					id
					settings
				}
			}
		`,
			{ userId }
		);

		const calendarSettings = userData.users_by_pk?.settings?.tokens?.google_calendar;

		if (!calendarSettings?.encrypted) {
			console.error('No calendar token found for user');
			return json({ success: false, error: 'Google Calendar not connected' }, { status: 401 });
		}

		let accessToken = decryptToken(calendarSettings.encrypted);

		// Check if token is expired and refresh if needed
		if (calendarSettings.expires_at && Date.now() >= calendarSettings.expires_at) {
			console.log('Token expired, refreshing...');

			if (!calendarSettings.refresh_token) {
				return json(
					{
						success: false,
						error: 'Calendar token expired and no refresh token available. Please reconnect.'
					},
					{ status: 401 }
				);
			}

			const refreshToken = decryptToken(calendarSettings.refresh_token);
			const newTokenData = await refreshGoogleToken(refreshToken);
			accessToken = newTokenData.access_token;

			// Update stored token
			const currentSettings = userData.users_by_pk?.settings || {};
			await serverRequest(UPDATE_USER, {
				where: { id: { _eq: userId } },
				_set: {
					settings: {
						...currentSettings,
						tokens: {
							...(currentSettings.tokens || {}),
							google_calendar: {
								...calendarSettings,
								encrypted: encryptToken(accessToken),
								expires_at: Date.now() + newTokenData.expires_in * 1000
							}
						}
					}
				}
			});

			console.log('Token refreshed successfully');
		}

		const oauth2Client = new google.auth.OAuth2();
		oauth2Client.setCredentials({ access_token: accessToken });

		const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

		// Parse the ISO timestamp (dueDate is now an ISO string with timezone info)
		const dueDateTime = new Date(dueDate);

		// Use the hasTime flag to determine if event should be all-day or timed
		const isDateOnly = !hasTime;

		let event: any = {
			summary: title,
			description: description || ''
		};

		if (isDateOnly) {
			// All-day event - use date format (YYYY-MM-DD)
			const dateStr = dueDateTime.toISOString().split('T')[0];
			event.start = {
				date: dateStr,
				timeZone: 'UTC'
			};
			event.end = {
				date: dateStr,
				timeZone: 'UTC'
			};
			console.log('Creating all-day calendar event:', event);
		} else {
			// Timed event - use dateTime format
			event.start = {
				dateTime: dueDateTime.toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
			};
			// End time is 1 hour after start
			const endTime = new Date(dueDateTime.getTime() + 60 * 60 * 1000);
			event.end = {
				dateTime: endTime.toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
			};
			console.log('Creating timed calendar event:', event);
		}

		const response = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: event
		});

		console.log('Calendar event created:', response.data.id);
		return json({
			success: true,
			eventId: response.data.id,
			eventLink: response.data.htmlLink
		});
	} catch (error: any) {
		console.error('Failed to create calendar event:', error);
		console.error('Error details:', error.response?.data || error.message);
		return json(
			{
				success: false,
				error:
					error.response?.data?.error?.message || error.message || 'Failed to create calendar event'
			},
			{ status: 500 }
		);
	}
};
