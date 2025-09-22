// src/lib/server/upload.ts
import { B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME } from '$env/static/private';

const authorizeUrl = 'https://api.backblazeb2.com/b2api/v1/b2_authorize_account';

async function getBackblazeDetails() {
	try {
		const encodedCredentials = Buffer.from(B2_KEY_ID + ':' + B2_APPLICATION_KEY).toString('base64');

		const response = await fetch(authorizeUrl, {
			method: 'GET',
			headers: {
				Authorization: `Basic ${encodedCredentials}`
			}
		});

		if (!response.ok) {
			throw new Error(`Authorization failed with status: ${response.status}`);
		}

		const data = await response.json();
		return {
			apiUrl: data.apiUrl,
			authorizationToken: data.authorizationToken,
			accountId: data.accountId,
			downloadUrl: data.downloadUrl
		};
	} catch (error) {
		console.error('Backblaze authorization error:', error);
		throw new Error('Could not authorize with Backblaze.');
	}
}

async function getBucketId(
	apiUrl: string,
	authorizationToken: string,
	accountId: string,
	bucketName: string
) {
	try {
		const response = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
			method: 'POST',
			headers: {
				Authorization: authorizationToken,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ accountId })
		});

		if (!response.ok) {
			throw new Error(`Failed to list buckets: ${response.status}`);
		}

		const data = await response.json();
		const bucket = data.buckets.find((b: any) => b.bucketName === bucketName);

		if (bucket) {
			return bucket.bucketId;
		} else {
			const availableBuckets = data.buckets.map((b: any) => b.bucketName);
			console.error(
				`Bucket '${bucketName}' not found. Available buckets for this key:`,
				availableBuckets
			);
			throw new Error('Could not find the specified bucket.');
		}
	} catch (error) {
		console.error('Failed to get Bucket ID:', error);
		throw new Error('Could not find the specified bucket.');
	}
}

async function getUploadUrl(apiUrl: string, authorizationToken: string, bucketId: string) {
	try {
		const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
			method: 'POST',
			headers: {
				Authorization: authorizationToken,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ bucketId })
		});

		if (!response.ok) {
			throw new Error(`Failed to get upload URL: ${response.status}`);
		}

		const data = await response.json();
		return {
			uploadUrl: data.uploadUrl,
			uploadAuthToken: data.authorizationToken
		};
	} catch (error) {
		console.error('Failed to get upload URL:', error);
		throw new Error('Could not get an upload URL.');
	}
}

async function uploadFile(uploadUrl: string, uploadAuthToken: string, file: File) {
	try {
		const buffer = await file.arrayBuffer();

		const response = await fetch(uploadUrl, {
			method: 'POST',
			headers: {
				Authorization: uploadAuthToken,
				'X-Bz-File-Name': file.name,
				'Content-Type': file.type,
				'Content-Length': file.size.toString(),
				'X-Bz-Content-Sha1': 'do_not_verify'
			},
			body: buffer
		});

		if (!response.ok) {
			throw new Error(`Upload failed: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('File upload failed:', error);
		throw new Error('The file could not be uploaded.');
	}
}

// Main function
export async function uploadStreamToBackblaze(file: File) {
	const { apiUrl, authorizationToken, accountId, downloadUrl } = await getBackblazeDetails();
	const bucketId = await getBucketId(apiUrl, authorizationToken, accountId, B2_BUCKET_NAME);
	const { uploadUrl, uploadAuthToken } = await getUploadUrl(apiUrl, authorizationToken, bucketId);
	const uploadedFile = await uploadFile(uploadUrl, uploadAuthToken, file);

	const finalUrl = `${downloadUrl}/file/${B2_BUCKET_NAME}/${uploadedFile.fileName}`;

	return { success: true, url: finalUrl };
}
