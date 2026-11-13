/** @file src/lib/stores/__tests__/loggingRetry.test.ts */
// A failed log flush is retried with a growing delay and given up after a few
// attempts — during a Postgres outage it used to feed back into itself (#209).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { call } from '$lib/api/call';
import { loggingStore } from '../logging.svelte';

vi.mock('$lib/api/call', () => ({ call: vi.fn() }));

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
		vi.mocked(call).mockReset();
		fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		vi.stubGlobal('window', { location: { href: 'https://www.todzz.eu/en/test' } });
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('retries a failed log with backoff and gives up after 5 attempts', async () => {
		vi.mocked(call).mockRejectedValue(new TypeError('Failed to fetch'));

		loggingStore.error('RetryTest', 'boom');
		await vi.advanceTimersByTimeAsync(10_000); // first batch flush
		expect(call).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(29_000);
		expect(call).toHaveBeenCalledTimes(1); // still backing off (30 s)
		await vi.advanceTimersByTimeAsync(1_000);
		expect(call).toHaveBeenCalledTimes(2);

		await vi.advanceTimersByTimeAsync(60_000 + 90_000 + 120_000);
		expect(call).toHaveBeenCalledTimes(5);

		await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
		expect(call).toHaveBeenCalledTimes(5); // dropped, no endless retry
	});

	it('does not call /api/auth/token before flushing', async () => {
		vi.mocked(call).mockResolvedValue({ saved: 1 });

		loggingStore.warn('RetryTest', 'saved');
		await vi.advanceTimersByTimeAsync(10_000);

		expect(call).toHaveBeenCalledTimes(1);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('drops a log the server refuses for lack of sign-in', async () => {
		const authError = Object.assign(new Error('Authentication required'), {
			name: 'AuthenticationError'
		});
		vi.mocked(call).mockRejectedValue(authError);

		loggingStore.error('RetryTest', 'signed out');
		await vi.advanceTimersByTimeAsync(10_000 + 60 * 60 * 1000);

		expect(call).toHaveBeenCalledTimes(1);
	});

	it('drops a batch the server refuses as invalid', async () => {
		vi.mocked(call).mockRejectedValue(Object.assign(new Error('Invalid input'), { status: 400 }));

		loggingStore.error('RetryTest', 'refused');
		await vi.advanceTimersByTimeAsync(10_000 + 60 * 60 * 1000);

		expect(call).toHaveBeenCalledTimes(1);
	});

	it('sends a whole flush as one createLog request', async () => {
		vi.mocked(call).mockResolvedValue({ saved: 3 });

		loggingStore.error('BatchTest', 'one');
		loggingStore.warn('BatchTest', 'two');
		loggingStore.info('BatchTest', 'not saved');
		loggingStore.error('BatchTest', 'three');
		await vi.advanceTimersByTimeAsync(10_000);

		expect(call).toHaveBeenCalledTimes(1);
		const [op, input] = vi.mocked(call).mock.calls[0] as [string, { logs: { message: string }[] }];
		expect(op).toBe('createLog');
		expect(input.logs.map((l) => l.message)).toEqual(['one', 'two', 'three']);
	});

	it('saves the same message at most once a minute', async () => {
		vi.mocked(call).mockResolvedValue({ saved: 1 });
		const saved = () =>
			vi.mocked(call).mock.calls.flatMap(([, input]) => (input as { logs: unknown[] }).logs).length;

		for (let i = 0; i < 20; i++) loggingStore.error('LoopTest', 'same thing');
		await vi.advanceTimersByTimeAsync(10_000);
		expect(saved()).toBe(1);

		await vi.advanceTimersByTimeAsync(50_000);
		loggingStore.error('LoopTest', 'same thing');
		await vi.advanceTimersByTimeAsync(10_000);
		expect(saved()).toBe(2);
		expect(loggingStore.logs.filter((l) => l.component === 'LoopTest')).toHaveLength(21);
	});

	it('saves at most 100 logs an hour per tab', async () => {
		vi.mocked(call).mockResolvedValue({ saved: 1 });
		const saved = () =>
			vi.mocked(call).mock.calls.flatMap(([, input]) => (input as { logs: unknown[] }).logs).length;

		vi.advanceTimersByTime(60 * 60 * 1000); // a fresh hour for this test
		for (let i = 0; i < 150; i++) loggingStore.warn('FloodTest', `message ${i}`);
		await vi.advanceTimersByTimeAsync(10_000);
		expect(saved()).toBe(100);

		await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
		loggingStore.warn('FloodTest', 'next hour');
		await vi.advanceTimersByTimeAsync(10_000);
		expect(saved()).toBe(101);
	});
});
