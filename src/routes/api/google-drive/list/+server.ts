/** @file src/routes/api/google-drive/list/+server.ts */
import { json } from '@sveltejs/kit';
import { googleFetch } from '$lib/server/google';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();

		if (!session || !session.accessToken) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Get folder ID from query params (optional, defaults to root)
		const folderId = url.searchParams.get('folderId') || 'root';
		const type = url.searchParams.get('type') || 'all'; // 'folders', 'files', 'all'

		// Build query based on type
		let query = `'${folderId}' in parents and trashed = false`;
		if (type === 'folders') {
			query += ` and mimeType = 'application/vnd.google-apps.folder'`;
		} else if (type === 'files') {
			query += ` and mimeType != 'application/vnd.google-apps.folder'`;
		}

		// List files/folders
		const data = await googleFetch(session.accessToken, 'https://www.googleapis.com/drive/v3/files', {
			query: {
				q: query,
				fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, thumbnailLink)',
				orderBy: 'folder,name',
				pageSize: 1000
			}
		});

		return json({
			success: true,
			items: data.files || [],
			folderId
		});
	} catch (error: any) {
		console.error('Google Drive API error:', error);

		let errorMessage = 'Failed to list Drive items';
		if (error.code === 401) {
			errorMessage = 'Google Drive access token expired. Please sign in again.';
		} else if (error.message) {
			errorMessage = error.message;
		}

		return json({ error: errorMessage }, { status: error.code || 500 });
	}
};
