/** @file src/lib/api/call.ts */
// The browser's way to the data API: call('getLogs', { limit: 50 }) posts to
// /api/data/getLogs with the session cookie. Types come from the server registry.
import type { z } from 'zod';
import type { Ops, OpName } from '$lib/server/ops';

export type OpInput<K extends OpName> = z.input<Ops[K]['input']>;
export type OpOutput<K extends OpName> = Awaited<ReturnType<Ops[K]['run']>>;

/** Same error request() throws when signed out, so callers drop the work the same way. */
function authenticationError() {
	const error = new Error('Authentication required');
	error.name = 'AuthenticationError';
	return error;
}

export async function call<K extends OpName>(op: K, input: OpInput<K>): Promise<OpOutput<K>> {
	const response = await fetch(`/api/data/${op}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input)
	});
	if (response.status === 401) throw authenticationError();

	const body = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw Object.assign(new Error(body.error || `${op} failed (${response.status})`), {
			status: response.status
		});
	}
	return body.data;
}
