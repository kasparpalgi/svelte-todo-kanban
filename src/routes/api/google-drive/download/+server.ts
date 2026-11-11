/** @file src/routes/api/google-drive/download/+server.ts */
import { json } from '@sveltejs/kit';
import { googleFetch } from '$lib/server/google';
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

		const fileUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;

		// Get file metadata
		const fileMetadata = await googleFetch(session.accessToken, fileUrl, {
			query: { fields: 'id, name, mimeType, size' }
		});

		// Download file content
		const content = await googleFetch<ArrayBuffer>(session.accessToken, fileUrl, {
			query: { alt: 'media' },
			raw: true
		});

		// Convert to base64 for transfer
		const buffer = Buffer.from(content);
		const base64 = buffer.toString('base64');

		return json({
			success: true,
			file: {
				id: fileMetadata.id,
				name: fileMetadata.name,
				mimeType: fileMetadata.mimeType,
				size: fileMetadata.size,
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
