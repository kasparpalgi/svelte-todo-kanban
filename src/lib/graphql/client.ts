/** @file src/lib/graphql/client.ts */
import { PUBLIC_API_ENDPOINT, PUBLIC_API_ENDPOINT_DEV, PUBLIC_API_ENV } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';
import { browser } from '$app/environment';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? PUBLIC_API_ENDPOINT : PUBLIC_API_ENDPOINT_DEV;
const client = new GraphQLClient(apiEndpoint);

async function getJWTToken(fetchFn: typeof globalThis.fetch = globalThis.fetch): Promise<string> {
	const response = await fetchFn('/api/auth/token');
	if (!response.ok) {
		if (browser) {
			const { loggingStore } = await import('$lib/stores/logging.svelte');
			loggingStore.error('GraphQLClient', 'Failed to fetch JWT token', {
				status: response.status,
				statusText: response.statusText
			});
		}
		throw new Error('Failed to get JWT token');
	}
	const data = await response.json();
	return data.token;
}

export async function request<TResult, TVariables = any>(
	document: { toString(): string },
	variables?: TVariables,
	customHeaders?: HeadersInit,
	fetchFn?: typeof globalThis.fetch
): Promise<TResult> {
	const startTime = browser ? performance.now() : 0;
	const query = document.toString();
	const operationMatch = query.match(/(query|mutation)\s+(\w+)/);
	const operationName = operationMatch ? operationMatch[2] : 'Unknown';
	const operationType = operationMatch ? operationMatch[1] : 'unknown';

	try {
		const useFetch = fetchFn || globalThis.fetch;
		const token = await getJWTToken(useFetch);

		const headers = {
			Authorization: `Bearer ${token}`,
			...customHeaders
		};

		const result = await client.request<TResult>(query, variables as any, headers);

		// Log slow operations
		if (browser) {
			const duration = performance.now() - startTime;
			if (duration > 1000) {
				const { loggingStore } = await import('$lib/stores/logging.svelte');
				loggingStore.warn('GraphQLClient', `Slow ${operationType}: ${operationName}`, {
					operation: operationName,
					duration: `${Math.round(duration)}ms`,
					type: operationType
				});
			}
		}

		return result;
	} catch (error: any) {
		if (browser) {
			const duration = performance.now() - startTime;
			const { loggingStore } = await import('$lib/stores/logging.svelte');

			const isAuthError =
				error?.message?.toLowerCase().includes('auth') ||
				error?.message?.toLowerCase().includes('token') ||
				error?.message?.toLowerCase().includes('permission');

			const isNetworkError =
				error?.message?.toLowerCase().includes('network') ||
				error?.message?.toLowerCase().includes('fetch');

			loggingStore.error('GraphQLClient', `${operationType} failed: ${operationName}`, {
				operation: operationName,
				type: operationType,
				error: {
					message: error?.message,
					response: error?.response,
					status: error?.response?.status
				},
				duration: `${Math.round(duration)}ms`,
				variables: variables ? Object.keys(variables as object) : [],
				errorType: isAuthError ? 'authentication' : isNetworkError ? 'network' : 'graphql'
			});
		}

		console.error('[GraphQLClient] Request failed:', {
			operation: operationName,
			type: operationType,
			error
		});

		throw error;
	}
}
