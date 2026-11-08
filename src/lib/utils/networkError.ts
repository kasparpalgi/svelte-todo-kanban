/** @file src/lib/utils/networkError.ts */

// How each browser words a request that never got a response: Chrome "Failed to
// fetch", Safari "Load failed" / "The network connection was lost.", Firefox
// "NetworkError when attempting to fetch resource.", React Native-style polyfills
// "Network request failed". Safari's wording slipped past the old
// `includes('fetch')` check and logged 256 dropped connections as errors (#209).
const NETWORK_ERROR_RE =
	/failed to fetch|load failed|networkerror|network request failed|network error|network connection was lost|fetch is aborted/i;

const EXTENSION_URL_RE = /(chrome|moz|safari(-web)?)-extension:\/\//;

/**
 * True when a request failed in transport (offline, dropped connection, aborted
 * navigation) rather than with an HTTP/GraphQL answer. Not an app bug: callers log
 * it as a warning and retry later.
 */
export function isNetworkError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const e = error as { name?: unknown; message?: unknown; response?: unknown };

	// graphql-request's ClientError carries the server's response: the request
	// arrived, so it is a real error even if its text mentions "network".
	if (e.response) return false;
	if (e.name === 'AbortError') return true;
	return typeof e.message === 'string' && NETWORK_ERROR_RE.test(e.message);
}

/**
 * True when a stack trace runs through a browser extension. Extensions that wrap
 * `window.fetch` often chain on the page's promise without a rejection handler, so a
 * failed request the app already handled resurfaces as an "unhandled rejection" (#209).
 */
export function isExtensionStack(stack: unknown): boolean {
	return typeof stack === 'string' && EXTENSION_URL_RE.test(stack);
}
