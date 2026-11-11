/** @file src/lib/server/__tests__/google.test.ts */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { googleFetch, GoogleApiError } from '../google';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

afterEach(() => fetchMock.mockReset());

describe('googleFetch', () => {
	it('sends bearer token, query and JSON body', async () => {
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'e1' }), { status: 200 }));

		const data = await googleFetch('tok', 'https://example.com/api', {
			method: 'POST',
			query: { a: 'x y', skip: undefined },
			body: { summary: 'Hi' }
		});

		expect(data).toEqual({ id: 'e1' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toBe('https://example.com/api?a=x+y');
		expect(init.method).toBe('POST');
		expect(init.headers).toEqual({
			Authorization: 'Bearer tok',
			'Content-Type': 'application/json'
		});
		expect(init.body).toBe('{"summary":"Hi"}');
	});

	it('returns an ArrayBuffer when raw is set', async () => {
		fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
		const buf = await googleFetch<ArrayBuffer>('tok', 'https://example.com/f', { raw: true });
		expect(new Uint8Array(buf)).toEqual(new Uint8Array([1, 2, 3]));
	});

	it('throws GoogleApiError with status and Google message', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), { status: 401 })
		);
		const err = await googleFetch('tok', 'https://example.com/api').catch((e) => e);
		expect(err).toBeInstanceOf(GoogleApiError);
		expect(err.code).toBe(401);
		expect(err.message).toBe('Invalid Credentials');
	});
});
