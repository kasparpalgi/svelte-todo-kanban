/** @file src/lib/utils/crypto.ts  */
import { SECRET_ENCRYPTION_KEY } from '$env/static/private';
import crypto from 'crypto';
import type { EncryptedData } from '$lib/types/common';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'github-token-salt';

function getKey(): Buffer {
	if (!SECRET_ENCRYPTION_KEY) {
		throw new Error('SECRET_ENCRYPTION_KEY is not defined');
	}
	return crypto.scryptSync(SECRET_ENCRYPTION_KEY, SALT, 32);
}

export function encryptToken(text: string): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const authTag = cipher.getAuthTag();

	const data: EncryptedData = {
		encrypted,
		iv: iv.toString('hex'),
		authTag: authTag.toString('hex')
	};

	return JSON.stringify(data);
}

export function decryptToken(encryptedData: string): string {
	const { encrypted, iv, authTag }: EncryptedData = JSON.parse(encryptedData);

	const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'hex'));
	decipher.setAuthTag(Buffer.from(authTag, 'hex'));

	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
