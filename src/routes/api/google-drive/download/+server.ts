/** @file src/routes/api/google-drive/download/+server.ts */
import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();

		if (!session || !session.accessToken) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { fileId } = await request.json();

		if (!fileId) {
			return json({ error: 'File ID is required' }, { status: 400 });
		}

		// Initialize OAuth2 client with the access token
		const oauth2Client = new google.auth.OAuth2();
		oauth2Client.setCredentials({
			access_token: session.accessToken
		});

		const drive = google.drive({ version: 'v3', auth: oauth2Client });

		// Get file metadata
		const fileMetadata = await drive.files.get({
			fileId,
			fields: 'id, name, mimeType, size'
		});

		// Download file content
		const response = await drive.files.get(
			{
				fileId,
				alt: 'media'
			},
			{ responseType: 'arraybuffer' }
		);

		// Convert to base64 for transfer
		const buffer = Buffer.from(response.data as ArrayBuffer);
		const base64 = buffer.toString('base64');

		return json({
			success: true,
			file: {
				id: fileMetadata.data.id,
				name: fileMetadata.data.name,
				mimeType: fileMetadata.data.mimeType,
				size: fileMetadata.data.size,
				content: base64
			}
		});
	} catch (error: any) {
		console.error('Google Drive download error:', error);

		let errorMessage = 'Failed to download file';
		if (error.code === 401) {
			errorMessage = 'Google Drive access token expired. Please sign in again.';
		} else if (error.code === 404) {
			errorMessage = 'File not found';
		} else if (error.message) {
			errorMessage = error.message;
		}

		return json({ error: errorMessage }, { status: error.code || 500 });
	}
};
