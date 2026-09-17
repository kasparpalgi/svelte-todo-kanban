/** @file src/lib/graphql/client.ts */
import { PUBLIC_API_ENDPOINT, PUBLIC_API_ENDPOINT_DEV, PUBLIC_API_ENV } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';
import { browser } from '$app/environment';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? PUBLIC_API_ENDPOINT : PUBLIC_API_ENDPOINT_DEV;
const client = new GraphQLClient(apiEndpoint);

// Legacy localStorage cache key. We no longer persist the JWT (see getJWTToken),
// but we still purge any value a previous build left behind so a stale token can
// never be read back after a user switch.
const TOKEN_LS_KEY = 'app_jwt_cache';
const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000; // refresh 10 min before expiry

// In-memory cache for the current page session + deduplication of concurrent
// fetches. BROWSER ONLY: this module state is shared across every SSR request on
// the server, so caching it there would leak one user's token into another user's
// request. On the server we dedupe per-request instead (see _ssrTokenByFetch).
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;
let _tokenFetchPromise: Promise<string | null> | null = null;

// SSR: dedupe token mints WITHIN a single request without ever sharing across
// requests. Keyed by the request-scoped `fetch` (SvelteKit gives each request its
// own `event.fetch`), so two users' concurrent renders can never collide, yet the
// several request() calls in one load reuse a single token + existence check.
const _ssrTokenByFetch = new WeakMap<object, { token: string | null; expiresAt: number }>();

function decodeTokenPayload(token: string): any | null {
	try {
		return JSON.parse(atob(token.split('.')[1]));
	} catch {
		return null;
	}
}

function getTokenExpiry(token: string): number {
	const payload = decodeTokenPayload(token);
	return payload ? payload.exp * 1000 : Date.now() + 23 * 60 * 60 * 1000;
}

function getTokenUserId(token: string): string | null {
	const payload = decodeTokenPayload(token);
	return payload?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] ?? payload?.sub ?? null;
}

/** Remove any JWT a previous build persisted to localStorage. */
function purgeLegacyPersistedToken() {
	if (!browser) return;
	try {
		localStorage.removeItem(TOKEN_LS_KEY);
	} catch {}
}

/**
 * A cached JWT can outlive the account it was minted for (shared browser profile,
 * sign-out/sign-in as a different user, synced Chrome profile). Hasura's update
 * permission `check` compares the row being written to the token's
 * x-hasura-user-id, so a stale token for a different user fails every mutation
 * with a permission-check error even though the UI shows the new user as signed in.
 * Discard the in-memory token when it was minted for anyone but the active user.
 */
export function ensureTokenForUser(userId: string | null | undefined) {
	if (!userId) return;

	if (_cachedToken && getTokenUserId(_cachedToken) !== userId) {
		clearTokenCache();
	}
	// Belt-and-suspenders: never let a legacy persisted token resurface.
	purgeLegacyPersistedToken();
}

export function clearTokenCache() {
	_cachedToken = null;
	_tokenExpiresAt = 0;
	purgeLegacyPersistedToken();
}

async function fetchFreshToken(fetchFn: typeof globalThis.fetch): Promise<string | null> {
	const response = await fetchFn('/api/auth/token');

	if (response.status === 401) {
		console.debug('[GraphQLClient] User not authenticated (401)');
		clearTokenCache();
		return null;
	}

	if (!response.ok) {
		console.error('[GraphQLClient] Failed to fetch JWT token', {
			status: response.status,
			statusText: response.statusText
		});
		throw new Error(`Failed to get JWT token: ${response.status}`);
	}

	const data = await response.json();
	return data.token as string;
}

async function getJWTToken(
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<string | null> {
	// Server (SSR): the module-level cache is shared across every concurrent
	// request, so caching a token there would hand one user's token to another
	// user's request. Bind the token to THIS request's session cookie (carried by
	// the passed fetchFn) and cache it only against that fetchFn, so it is reused
	// within the request but never leaks across requests/users.
	if (!browser) {
		const now = Date.now();
		const perRequest = typeof fetchFn === 'function' ? _ssrTokenByFetch.get(fetchFn) : undefined;
		if (perRequest && perRequest.token && now < perRequest.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
			return perRequest.token;
		}
		try {
			const token = await fetchFreshToken(fetchFn);
			if (typeof fetchFn === 'function') {
				_ssrTokenByFetch.set(fetchFn, {
					token,
					expiresAt: token ? getTokenExpiry(token) : 0
				});
			}
			return token;
		} catch (error) {
			if (error instanceof TypeError) {
				console.debug('[GraphQLClient] Network error fetching token:', error.message);
			}
			throw error;
		}
	}

	const now = Date.now();

	// In-memory cache (per page load; cleared on reload / login / logout). We do
	// NOT persist to localStorage: a persisted token survives a full-page OAuth
	// login and would carry the previous user's identity into the new session.
	if (_cachedToken && now < _tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
		return _cachedToken;
	}

	// Deduplicate concurrent token fetches (single in-flight request)
	if (_tokenFetchPromise) return _tokenFetchPromise;

	_tokenFetchPromise = (async () => {
		try {
			const token = await fetchFreshToken(fetchFn);
			if (!token) return null;

			_cachedToken = token;
			_tokenExpiresAt = getTokenExpiry(token);
			return token;
		} catch (error) {
			if (error instanceof TypeError) {
				console.debug('[GraphQLClient] Network error fetching token:', error.message);
			}
			throw error;
		} finally {
			_tokenFetchPromise = null;
		}
	})();

	return _tokenFetchPromise;
}

export async function publicRequest<TResult, TVariables = any>(
	document: { toString(): string },
	variables?: TVariables,
	customHeaders?: HeadersInit
): Promise<TResult> {
	const query = document.toString();
	const headers = {
		'X-Hasura-Role': 'anonymous',
		...customHeaders
	};
	return client.request<TResult>(query, variables as any, headers);
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

		if (!token) {
			const authError = new Error('Authentication required');
			authError.name = 'AuthenticationError';
			throw authError;
		}

		const headers = {
			Authorization: `Bearer ${token}`,
			...customHeaders
		};

		const result = await client.request<TResult>(query, variables as any, headers);

		// Log slow operations
		if (browser) {
			const duration = performance.now() - startTime;
			if (duration > 1000) {
				try {
					const { loggingStore } = await import('$lib/stores/logging.svelte');
					loggingStore.warn('GraphQLClient', `Slow ${operationType}: ${operationName}`, {
						operation: operationName,
						duration: `${Math.round(duration)}ms`,
						type: operationType
					});
				} catch (logError) {
					console.debug('[GraphQLClient] Failed to log slow operation:', logError);
				}
			}
		}

		return result;
	} catch (error: any) {
		const isAuthError =
			error?.name === 'AuthenticationError' ||
			error?.message === 'Authentication required' ||
			error?.message?.toLowerCase().includes('auth') ||
			error?.message?.toLowerCase().includes('token') ||
			error?.message?.toLowerCase().includes('permission');

		// log only non-auth errors (prev. infinite loop)
		if (browser && !isAuthError) {
			const duration = performance.now() - startTime;

			try {
				const { loggingStore } = await import('$lib/stores/logging.svelte');

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
					errorType: isNetworkError ? 'network' : 'graphql'
				});
			} catch (logError) {
				console.debug('[GraphQLClient] Failed to log error:', logError);
			}
		}

		if (isAuthError) {
			console.debug('[GraphQLClient] Authentication error:', operationName);
		} else {
			console.error('[GraphQLClient] Request failed:', {
				operation: operationName,
				type: operationType,
				error
			});
		}

		throw error;
	}
}
