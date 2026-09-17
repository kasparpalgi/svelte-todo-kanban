// src/routes/api/upload/+server.ts
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '$env/static/private';
import { uploadStreamToBackblaze } from '$lib/server/upload';
import { getPlanContext } from '$lib/server/plan';
import { decryptToken } from '$lib/utils/crypto';
import { uploadToR2, type R2Credentials } from '$lib/server/r2';
import { serverRequest } from '$lib/graphql/server-client';
import { FREE_LIMITS } from '$lib/config/plan';
import { json, type RequestEvent } from '@sveltejs/kit';

const maxFileSize = parseInt(MAX_FILE_SIZE);
const allowedFileTypes = ALLOWED_FILE_TYPES?.split(',');

/** Total uploads owned by a user (across all their todos). */
async function countUserUploads(userId: string): Promise<number> {
	const data = await serverRequest<
		{ uploads_aggregate: { aggregate: { count: number } | null } },
		{ userId: string }
	>(
		`query CountUserUploads($userId: uuid!) {
			uploads_aggregate(where: { todo: { user_id: { _eq: $userId } } }) {
				aggregate { count }
			}
		}`,
		{ userId }
	);
	return data.uploads_aggregate?.aggregate?.count ?? 0;
}

/** Decrypt a user's stored R2 credentials, or null when not configured/invalid. */
function getR2Credentials(settings: Record<string, any> | null): R2Credentials | null {
	const encrypted = settings?.tokens?.r2?.encrypted;
	if (!encrypted) return null;
	try {
		const creds = JSON.parse(decryptToken(encrypted)) as R2Credentials;
		if (
			creds.accountId &&
			creds.accessKeyId &&
			creds.secretAccessKey &&
			creds.bucket &&
			creds.publicBaseUrl
		) {
			return creds;
		}
		return null;
	} catch {
		return null;
	}
}

export async function POST({ request, locals }: RequestEvent) {
	try {
		const session = await locals.auth();
		const userId = session?.user?.id;
		if (!userId) {
			return json({ success: false, error: 'Not authenticated' }, { status: 401 });
		}

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

		const ctx = await getPlanContext(userId);
		const r2Creds = getR2Credentials(ctx?.settings ?? null);

		const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const fileToUpload =
			sanitizedName !== file.name ? new File([file], sanitizedName, { type: file.type }) : file;

		// Route 1: user's own R2 bucket — no plan limit applies.
		if (r2Creds) {
			const key = `${userId}/${Date.now()}-${sanitizedName}`;
			const result = await uploadToR2(fileToUpload, r2Creds, key);
			if (result.success) {
				return json({
					success: true,
					url: result.url,
					fileName: fileToUpload.name,
					fileType: fileToUpload.type,
					fileSize: fileToUpload.size
				});
			}
			return json({ success: false, error: result.error || 'R2 upload failed' }, { status: 500 });
		}

		// Route 2: free plan without R2 — enforce the upload cap (soft upsell).
		if (!ctx?.isPaid) {
			const used = await countUserUploads(userId);
			if (used >= FREE_LIMITS.uploads) {
				return json(
					{
						success: false,
						error: `Free plan is limited to ${FREE_LIMITS.uploads} uploads. Add your own Cloudflare R2 key in Settings, or upgrade to the paid plan.`,
						upsell: 'uploads'
					},
					{ status: 402 }
				);
			}
		}

		// Route 3: paid plan, or free plan under the cap — use the app's storage.
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
