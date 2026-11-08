/** @file src/lib/utils/__tests__/networkError.test.ts */
import { describe, it, expect } from 'vitest';
import { isExtensionStack, isNetworkError } from '../networkError';

describe('isNetworkError', () => {
	it.each([
		['Chrome', 'Failed to fetch'],
		['Safari', 'Load failed'],
		['Safari (lost connection)', 'The network connection was lost.'],
		['Firefox', 'NetworkError when attempting to fetch resource.'],
		['polyfill', 'Network request failed']
	])('recognises the %s wording', (_browser, message) => {
		expect(isNetworkError(new TypeError(message))).toBe(true);
	});

	it('treats an aborted request as a network outcome', () => {
		expect(isNetworkError(new DOMException('The user aborted a request.', 'AbortError'))).toBe(
			true
		);
	});

	it('is false for an error that carries a server response', () => {
		// graphql-request ClientError: the request arrived, Hasura answered.
		const clientError = Object.assign(new Error('connection error: {"response":…}'), {
			response: { status: 200, errors: [{ message: 'connection error' }] }
		});
		expect(isNetworkError(clientError)).toBe(false);
		const mentionsNetwork = Object.assign(new Error('network error'), { response: {} });
		expect(isNetworkError(mentionsNetwork)).toBe(false);
	});

	it('is false for app errors and non-errors', () => {
		expect(isNetworkError(new Error('invalid input syntax for type uuid'))).toBe(false);
		expect(
			isNetworkError(new TypeError("Cannot read properties of undefined (reading 'prev')"))
		).toBe(false);
		expect(isNetworkError(null)).toBe(false);
		expect(isNetworkError('Failed to fetch')).toBe(false);
	});
});

describe('isExtensionStack', () => {
	it('spots a browser extension frame', () => {
		const stack = [
			'TypeError: Failed to fetch',
			'    at window.fetch (https://www.todzz.eu/_app/immutable/chunks/CITzjSnl.js:1:2619)',
			'    at s.fetch (chrome-extension://pphgdbgldlmicfdkhondlafkiomnelnk/libs/requests.js:1:3633)'
		].join('\n');
		expect(isExtensionStack(stack)).toBe(true);
		expect(isExtensionStack('at moz-extension://abc/content.js:1:1')).toBe(true);
		expect(isExtensionStack('at safari-web-extension://abc/content.js:1:1')).toBe(true);
	});

	it('is false for app-only stacks and non-strings', () => {
		expect(isExtensionStack('at https://www.todzz.eu/_app/immutable/chunks/x.js:1:1')).toBe(false);
		expect(isExtensionStack(undefined)).toBe(false);
	});
});
