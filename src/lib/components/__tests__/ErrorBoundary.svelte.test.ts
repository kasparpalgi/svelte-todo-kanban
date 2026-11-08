/** @file src/lib/components/__tests__/ErrorBoundary.svelte.test.ts */
// 220 "Unhandled promise rejection" error rows in Oct 2026 were one browser
// extension re-raising network failures request() had already logged (#209).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ErrorBoundary from '../ErrorBoundary.svelte';
import { loggingStore } from '$lib/stores/logging.svelte';

vi.mock('$lib/stores/logging.svelte', () => ({
	loggingStore: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

function reject(reason: unknown) {
	const promise = Promise.reject(reason);
	promise.catch(() => {}); // keep the test runner itself from seeing it
	window.dispatchEvent(
		new PromiseRejectionEvent('unhandledrejection', { promise, reason, cancelable: true })
	);
}

function networkError(stack: string) {
	const error = new TypeError('Failed to fetch');
	error.stack = stack;
	return error;
}

describe('ErrorBoundary unhandled rejections', () => {
	beforeEach(() => {
		vi.mocked(loggingStore.error).mockClear();
		vi.mocked(loggingStore.warn).mockClear();
		vi.mocked(loggingStore.debug).mockClear();
	});

	it('keeps an extension-re-raised network failure out of the error log', () => {
		render(ErrorBoundary);
		reject(
			networkError(
				'TypeError: Failed to fetch\n    at s.fetch (chrome-extension://pphgdbgldlmicfdkhondlafkiomnelnk/libs/requests.js:1:3633)'
			)
		);

		expect(loggingStore.error).not.toHaveBeenCalled();
		expect(loggingStore.warn).not.toHaveBeenCalled();
		expect(loggingStore.debug).toHaveBeenCalledWith(
			'ErrorBoundary',
			'Extension re-raised a network failure',
			expect.objectContaining({ isNetworkError: true })
		);
	});

	it('logs an app network failure nobody caught as a warning', () => {
		render(ErrorBoundary);
		reject(networkError('TypeError: Load failed\n    at https://www.todzz.eu/_app/x.js:1:1'));

		expect(loggingStore.error).not.toHaveBeenCalled();
		expect(loggingStore.warn).toHaveBeenCalledWith(
			'ErrorBoundary',
			'Unhandled network failure',
			expect.anything()
		);
	});

	it('still logs a real bug as an error', () => {
		render(ErrorBoundary);
		reject(new TypeError("Cannot read properties of undefined (reading 'prev')"));

		expect(loggingStore.error).toHaveBeenCalledWith(
			'ErrorBoundary',
			'Unhandled promise rejection',
			expect.objectContaining({ isNetworkError: false })
		);
	});
});
