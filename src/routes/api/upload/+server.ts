// src/routes/api/upload/+server.ts
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '$env/static/private';
import { uploadStreamToBackblaze } from '$lib/server/upload';
import { json, type RequestEvent } from '@sveltejs/kit';

const maxFileSize = parseInt(MAX_FILE_SIZE);
const allowedFileTypes = ALLOWED_FILE_TYPES?.split(',');

export async function POST({ request }: RequestEvent) {
	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File)) {
			return json({ success: false, error: 'No file provided.' }, { status: 400 });
		}

		if (!allowedFileTypes.includes(file.type)) {
			return json(
				{
					success: false,
					error: `File type ${file.type} is not allowed. Allowed types: ${allowedFileTypes.join(', ')}.`
				},
				{ status: 400 }
			);
		}

		if (file.size > maxFileSize) {
			return json(
				{
					success: false,
					error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB.`
				},
				{ status: 400 }
			);
		}

		const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

		const fileToUpload =
			sanitizedName !== file.name ? new File([file], sanitizedName, { type: file.type }) : file;

		const result = await uploadStreamToBackblaze(fileToUpload);

		if (result.success) {
			return json({
				success: true,
				url: result.url,
				fileName: fileToUpload.name,
				fileType: fileToUpload.type,
				fileSize: fileToUpload.size
			});
		} else {
			return json({ success: false, error: 'Upload failed' }, { status: 500 });
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown upload error';
		console.error('Server-side upload error:', error);
		return json({ success: false, error: message }, { status: 500 });
	}
}
