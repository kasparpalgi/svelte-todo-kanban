/** @file src/lib/server/storeFile.ts
 * Where an uploaded file lands (#194): the owner's own R2 bucket when they saved one in
 * Settings, else the app's Backblaze bucket. Shared by /api/upload and the runner's
 * /api/runner/upload, so both pick the store the same way.
 */
import { decryptToken } from '$lib/utils/crypto';
import { uploadToR2, type R2Credentials } from '$lib/server/r2';
import { uploadStreamToBackblaze } from '$lib/server/upload';

/** Decrypt a user's stored R2 credentials, or null when not configured/invalid. */
export function getR2Credentials(settings: Record<string, any> | null): R2Credentials | null {
	const encrypted = settings?.tokens?.r2?.encrypted;
	if (!encrypted) return null;
	try {
		const creds = JSON.parse(decryptToken(encrypted)) as R2Credentials;
		const complete =
			creds.accountId &&
			creds.accessKeyId &&
			creds.secretAccessKey &&
			creds.bucket &&
			creds.publicBaseUrl;
		return complete ? creds : null;
	} catch {
		return null;
	}
}

/** Store `file` for `userId` in their R2 bucket, else in the app's Backblaze bucket. */
export async function storeFile(
	file: File,
	userId: string,
	r2: R2Credentials | null
): Promise<{ success: boolean; url?: string; error?: string }> {
	if (r2) return uploadToR2(file, r2, `${userId}/${Date.now()}-${file.name}`);
	return uploadStreamToBackblaze(file);
}
