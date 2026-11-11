/** @file src/lib/server/google.ts — minimal fetch client for Google REST APIs (replaces googleapis). */

/** Error thrown for a non-2xx Google API response; `code` is the HTTP status. */
export class GoogleApiError extends Error {
	constructor(
		message: string,
		public code: number
	) {
		super(message);
		this.name = 'GoogleApiError';
	}
}

type Query = Record<string, string | number | undefined>;

interface GoogleFetchOptions {
	method?: string;
	query?: Query;
	body?: unknown;
	/** Return the raw response body as an ArrayBuffer instead of parsed JSON. */
	raw?: boolean;
}

/** Call a Google REST endpoint with a bearer token. Throws GoogleApiError on failure. */
export async function googleFetch<T = any>(
	accessToken: string,
	url: string,
	{ method = 'GET', query, body, raw = false }: GoogleFetchOptions = {}
): Promise<T> {
	const target = new URL(url);
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined) target.searchParams.set(key, String(value));
	}

	const response = await fetch(target, {
		method,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...(body !== undefined && { 'Content-Type': 'application/json' })
		},
		body: body !== undefined ? JSON.stringify(body) : undefined
	});

	if (!response.ok) {
		const data = await response.json().catch(() => null);
		const message = data?.error?.message || `Google API ${response.status} ${response.statusText}`;
		throw new GoogleApiError(message, response.status);
	}

	if (raw) return (await response.arrayBuffer()) as T;
	if (response.status === 204) return undefined as T;
	return response.json();
}
