/** @file src/lib/graphql/__tests__/clientLogging.svelte.test.ts */
// How request() reports a failure (#209): a dropped connection is a warning in
// every browser's wording, and the logger's own CreateLog never logs itself.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { clearTokenCache, request } from '../client';
import { loggingStore } from '$lib/stores/logging.svelte';

vi.mock('$lib/stores/logging.svelte', () => ({
	loggingStore: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }
}));

function token(): string {
	const encode = (obj: unknown) => btoa(JSON.stringify(obj));
	const payload = { sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 };
	return `${encode({ alg: 'HS256' })}.${encode(payload)}.sig`;
}

/** Token endpoint works; the GraphQL POST fails with `graphqlError`. */
function stubFetch(graphqlError: Error) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: RequestInfo | URL) => {
			if (String(input).includes('/api/auth/token')) {
				return new Response(JSON.stringify({ token: token() }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			}
			throw graphqlError;
		})
	);
}

describe('request() failure logging', () => {
	beforeEach(() => {
		clearTokenCache();
		vi.mocked(loggingStore.warn).mockClear();
		vi.mocked(loggingStore.error).mockClear();
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		clearTokenCache();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it.each(['Load failed', 'Failed to fetch', 'NetworkError when attempting to fetch resource.'])(
		'logs a dropped connection (%s) as a warning',
		async (message) => {
			stubFetch(new TypeError(message));
			await expect(request('query GetTodos { todos { id } }', {})).rejects.toThrow(message);

			expect(loggingStore.error).not.toHaveBeenCalled();
			expect(loggingStore.warn).toHaveBeenCalledWith(
				'GraphQLClient',
				'query failed: GetTodos',
				expect.objectContaining({ errorType: 'network' })
			);
		}
	);

	it('does not log a failed CreateLog (the logger retries it itself)', async () => {
		stubFetch(new TypeError('Failed to fetch'));
		await expect(
			request(
				'mutation CreateLog($log: logs_insert_input!) { insert_logs_one(object: $log) { id } }',
				{
					log: {}
				}
			)
		).rejects.toThrow();

		expect(loggingStore.warn).not.toHaveBeenCalled();
		expect(loggingStore.error).not.toHaveBeenCalled();
	});
});
