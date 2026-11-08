/** @file src/routes/api/runner/__tests__/upload.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const serverRequest = vi.fn();
const storeFile = vi.fn();

vi.mock('$env/static/private', () => ({ HASURA_ADMIN_SECRET: 'admin' }));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: (...a: unknown[]) => serverRequest(...a)
}));
vi.mock('$lib/server/plan', () => ({ getPlanContext: async () => ({ settings: null }) }));
vi.mock('$lib/server/storeFile', () => ({
	getR2Credentials: () => null,
	storeFile: (...a: unknown[]) => storeFile(...a)
}));

const { POST } = await import('../upload/+server');

const call = (secret: string, file: File) => {
	const form = new FormData();
	form.set('todo_id', 'card-1');
	form.set('file', file);
	const request = new Request('http://x/api/runner/upload', {
		method: 'POST',
		headers: { 'x-hasura-admin-secret': secret },
		body: form
	});
	return POST({ request } as never);
};

const png = new File([new Uint8Array([137, 80, 78, 71])], '069-a-1.png', { type: 'image/png' });

describe('POST /api/runner/upload', () => {
	beforeEach(() => {
		serverRequest.mockReset();
		storeFile.mockReset();
	});

	it('refuses a caller without the admin secret', async () => {
		expect((await call('wrong', png)).status).toBe(401);
		expect(storeFile).not.toHaveBeenCalled();
	});

	it('takes only PNGs', async () => {
		const txt = new File(['x'], 'a.txt', { type: 'text/plain' });
		expect((await call('admin', txt)).status).toBe(400);
	});

	it('stores the file for the board owner and attaches it to the card', async () => {
		serverRequest
			.mockResolvedValueOnce({ todos_by_pk: { list: { board: { user_id: 'owner' } } } })
			.mockResolvedValueOnce({});
		storeFile.mockResolvedValue({ success: true, url: 'https://cdn/069-a-1.png' });

		const body = await (await call('admin', png)).json();

		expect(body).toEqual({ success: true, url: 'https://cdn/069-a-1.png' });
		expect(storeFile.mock.calls[0][1]).toBe('owner');
		expect(serverRequest.mock.calls[1][1]).toEqual({
			o: { todo_id: 'card-1', url: 'https://cdn/069-a-1.png' }
		});
	});
});
