/** @file src/lib/api/__tests__/call.test.ts */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { call } from '../call';

const respond = (status: number, body: unknown) =>
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response(JSON.stringify(body), { status }))
	);

describe('call', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('posts the input as JSON and returns data', async () => {
		respond(200, { data: { board: null, unread: 1 } });

		expect(await call('poll', {})).toEqual({ board: null, unread: 1 });
		const [url, init] = vi.mocked(fetch).mock.calls[0];
		expect(url).toBe('/api/data/poll');
		expect(init).toMatchObject({ method: 'POST', body: '{}' });
	});

	it('throws the AuthenticationError request() throws when signed out', async () => {
		respond(401, { error: 'Authentication required' });
		await expect(call('poll', {})).rejects.toMatchObject({
			name: 'AuthenticationError',
			message: 'Authentication required'
		});
	});

	it('throws the server message with its status', async () => {
		respond(400, { error: 'Invalid input: limit Too big' });
		await expect(call('getLogs', { limit: 1 })).rejects.toMatchObject({
			message: 'Invalid input: limit Too big',
			status: 400
		});
	});
});
