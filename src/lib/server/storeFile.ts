/** @file src/lib/server/storeFile.ts
 * Where an uploaded file lands (#194): the owner's own R2 bucket when they saved one in
 * Settings, else the app's R2 bucket (#219; was Backblaze). Shared by /api/upload and the runner's
 * /api/runner/upload, so both pick the store the same way.
 */
import { decryptToken } from '$lib/utils/crypto';
import { uploadToR2, type R2Credentials } from '$lib/server/r2';
import { env } from '$env/dynamic/private';

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

/** The app's own R2 credentials from env, or null when not configured. */
export function getAppR2Credentials(): R2Credentials | null {
	const creds = {
		accountId: env.CLOUDFARE_ACCOUNT_ID,
		accessKeyId: env.CLOUDFARE_ACCESS_KEY_ID,
		secretAccessKey: env.CLOUDFARE_SECRET_ACCESS_KEY,
		bucket: env.R2_BUCKET_NAME,
		publicBaseUrl: env.R2_PUBLIC_URL
	};
	return Object.values(creds).every(Boolean) ? (creds as R2Credentials) : null;
}

/** Store `file` for `userId` in their R2 bucket, else in the app's R2 bucket. */
export async function storeFile(
	file: File,
	userId: string,
	r2: R2Credentials | null
): Promise<{ success: boolean; url?: string; error?: string }> {
	const creds = r2 ?? getAppR2Credentials();
	if (!creds) return { success: false, error: 'No storage configured' };
	return uploadToR2(file, creds, `${userId}/${Date.now()}-${file.name}`);
}
