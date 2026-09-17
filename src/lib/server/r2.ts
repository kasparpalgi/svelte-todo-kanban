/** @file src/lib/server/r2.ts
 * Minimal S3-compatible (Cloudflare R2) uploader (#194). Signs a single PUT with
 * AWS Signature V4 so free users can route uploads to their own bucket without
 * pulling in the full aws-sdk. Credentials are the user's, decrypted server-side.
 */
import crypto from 'crypto';

export interface R2Credentials {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	/** Public base URL for the bucket (custom domain or r2.dev), used to build the returned URL. */
	publicBaseUrl: string;
}

export interface R2UploadResult {
	success: boolean;
	url?: string;
	error?: string;
}

const REGION = 'auto';
const SERVICE = 's3';

function sha256Hex(data: Buffer | string): string {
	return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
	return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

/** Encode each path segment per AWS SigV4 (keep '/', encode everything else). */
function encodeKey(key: string): string {
	return key
		.split('/')
		.map((seg) => encodeURIComponent(seg))
		.join('/');
}

/**
 * Upload a file to the given R2 bucket. `key` is the object key; the returned
 * URL is `<publicBaseUrl>/<key>`.
 */
export async function uploadToR2(
	file: File,
	creds: R2Credentials,
	key: string
): Promise<R2UploadResult> {
	try {
		const host = `${creds.accountId}.r2.cloudflarestorage.com`;
		const encodedKey = encodeKey(key);
		const canonicalUri = `/${creds.bucket}/${encodedKey}`;

		const body = Buffer.from(await file.arrayBuffer());
		const payloadHash = sha256Hex(body);
		const contentType = file.type || 'application/octet-stream';

		const now = new Date();
		const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
		const dateStamp = amzDate.slice(0, 8); // YYYYMMDD

		const canonicalHeaders =
			`content-type:${contentType}\n` +
			`host:${host}\n` +
			`x-amz-content-sha256:${payloadHash}\n` +
			`x-amz-date:${amzDate}\n`;
		const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

		const canonicalRequest = [
			'PUT',
			canonicalUri,
			'', // no query string
			canonicalHeaders,
			signedHeaders,
			payloadHash
		].join('\n');

		const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
		const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join(
			'\n'
		);

		const kDate = hmac(`AWS4${creds.secretAccessKey}`, dateStamp);
		const kRegion = hmac(kDate, REGION);
		const kService = hmac(kRegion, SERVICE);
		const kSigning = hmac(kService, 'aws4_request');
		const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

		const authorization =
			`AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, ` +
			`SignedHeaders=${signedHeaders}, Signature=${signature}`;

		const response = await fetch(`https://${host}${canonicalUri}`, {
			method: 'PUT',
			headers: {
				'Content-Type': contentType,
				'x-amz-content-sha256': payloadHash,
				'x-amz-date': amzDate,
				Authorization: authorization
			},
			body
		});

		if (!response.ok) {
			const errText = await response.text().catch(() => '');
			console.error('R2 upload failed:', response.status, errText);
			return { success: false, error: `R2 upload failed (${response.status})` };
		}

		const base = creds.publicBaseUrl.replace(/\/+$/, '');
		return { success: true, url: `${base}/${encodedKey}` };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown R2 error';
		console.error('R2 upload error:', error);
		return { success: false, error: message };
	}
}
