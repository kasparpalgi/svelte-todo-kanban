import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title, description, dueDate, accessToken } = await request.json();

		console.log('Calendar event request:', { title, dueDate, hasToken: !!accessToken });

		if (!accessToken) {
			console.error('No access token provided');
			return json({ success: false, error: 'Unauthorized - no access token' }, { status: 401 });
		}

		const oauth2Client = new google.auth.OAuth2();
		oauth2Client.setCredentials({ access_token: accessToken });

		const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

		const event = {
			summary: title,
			description: description || '',
			start: {
				date: dueDate,
				timeZone: 'UTC'
			},
			end: {
				date: dueDate,
				timeZone: 'UTC'
			}
		};

		console.log('Creating calendar event:', event);

		const response = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: event
		});

		console.log('Calendar event created:', response.data.id);
		return json({ success: true, eventId: response.data.id });
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
