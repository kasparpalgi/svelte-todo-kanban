import { describe, it, expect, vi, beforeEach } from 'vitest';

const uploadToR2 = vi.fn();
const envMock: Record<string, string> = {};
vi.mock('$env/dynamic/private', () => ({ env: envMock }));
vi.mock('$lib/utils/crypto', () => ({ decryptToken: vi.fn() }));
vi.mock('$lib/server/r2', () => ({ uploadToR2: (...a: unknown[]) => uploadToR2(...a) }));

import { storeFile } from '../storeFile';

const file = new File(['x'], 'a.txt');
const own = { accountId: 'u', accessKeyId: 'u', secretAccessKey: 'u', bucket: 'u', publicBaseUrl: 'u' };

describe('storeFile', () => {
	beforeEach(() => {
		uploadToR2.mockReset().mockResolvedValue({ success: true, url: 'x' });
		for (const k of Object.keys(envMock)) delete envMock[k];
	});

	it("uses the owner's R2 when given", async () => {
		await storeFile(file, 'u1', own);
		expect(uploadToR2.mock.calls[0][1]).toBe(own);
	});

	it('falls back to the app R2 from env', async () => {
		Object.assign(envMock, {
			CLOUDFARE_ACCOUNT_ID: 'acc',
			CLOUDFARE_ACCESS_KEY_ID: 'k',
			CLOUDFARE_SECRET_ACCESS_KEY: 's',
			R2_BUCKET_NAME: 'b',
			R2_PUBLIC_URL: 'https://pub.r2.dev'
		});
		await storeFile(file, 'u1', null);
		expect(uploadToR2.mock.calls[0][1]).toMatchObject({ bucket: 'b', accountId: 'acc' });
		expect(uploadToR2.mock.calls[0][2]).toMatch(/^u1\//);
	});

	it('errors when nothing is configured', async () => {
		const r = await storeFile(file, 'u1', null);
		expect(r.success).toBe(false);
		expect(uploadToR2).not.toHaveBeenCalled();
	});
});
