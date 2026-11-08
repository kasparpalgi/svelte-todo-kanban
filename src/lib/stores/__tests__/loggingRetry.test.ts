/** @file src/lib/stores/__tests__/loggingRetry.test.ts */
// A failed log flush is retried with a growing delay and given up after a few
// attempts — during a Postgres outage it used to feed back into itself (#209).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { request } from '$lib/graphql/client';
import { loggingStore } from '../logging.svelte';

vi.mock('$lib/graphql/client', () => ({ request: vi.fn() }));

vi.mock('$app/environment', () => ({
	browser: true,
	dev: false, // production behaviour: failed logs are re-queued
	building: false,
	version: '1.0.0'
}));

vi.mock('$lib/config/logging', () => ({
	LOGGING_CONFIG: {
		retentionDays: 30,
		batchSize: 50,
		batchTimeout: 10_000,
		rateLimitWindow: 60_000,
		rateLimitMax: 100,
		sampling: { enabled: false, defaultRate: 1, componentRates: {} },
		performance: { slowOperationThreshold: 1000, maxSlowOperationsTracked: 50 },
		persistLevels: ['error', 'warn'],
		maxInMemoryLogs: 1000
	}
}));

describe('loggingStore flush retries', () => {
	let fetchSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(request).mockReset();
		fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		vi.stubGlobal('window', { location: { href: 'https://www.todzz.eu/en/test' } });
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('retries a failed log with backoff and gives up after 5 attempts', async () => {
		vi.mocked(request).mockRejectedValue(new TypeError('Failed to fetch'));

		loggingStore.error('RetryTest', 'boom');
		await vi.advanceTimersByTimeAsync(10_000); // first batch flush
		expect(request).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(29_000);
		expect(request).toHaveBeenCalledTimes(1); // still backing off (30 s)
		await vi.advanceTimersByTimeAsync(1_000);
		expect(request).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(60_000 + 90_000 + 120_000);
		expect(request).toHaveBeenCalledTimes(5);

		await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
		expect(request).toHaveBeenCalledTimes(5); // dropped, no endless retry
	});

	it('does not call /api/auth/token before flushing', async () => {
		vi.mocked(request).mockResolvedValue({ insert_logs_one: { id: 'x' } });

		loggingStore.warn('RetryTest', 'saved');
		await vi.advanceTimersByTimeAsync(10_000);

		expect(request).toHaveBeenCalledTimes(1);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('drops a log the server refuses for lack of sign-in', async () => {
		const authError = Object.assign(new Error('Authentication required'), {
			name: 'AuthenticationError'
		});
		vi.mocked(request).mockRejectedValue(authError);

		loggingStore.error('RetryTest', 'signed out');
		await vi.advanceTimersByTimeAsync(10_000 + 60 * 60 * 1000);

		expect(request).toHaveBeenCalledTimes(1);
	});
});
