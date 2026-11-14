/** @file src/lib/server/readOnly.ts */
// The cut-over's read-only switch (#234). With READ_ONLY=1 every request that could write
// answers 503, so the final Postgres → D1 copy misses nothing; pages and read ops still
// work. On the Worker it is a secret, so it flips without a redeploy:
// `echo 1 | npx wrangler secret put READ_ONLY` / `npx wrangler secret delete READ_ONLY`.
import { json, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const READ_ONLY_MESSAGE =
	'Todzz is read-only for a few minutes while it moves to a new database. Please try again shortly.';

const DATA_READ = /^(get|search|count|poll)/;
const RUNNER_READS = new Set([
	'board',
	'boards',
	'cards',
	'comments',
	'uploads',
	'pricing',
	'usage'
]);

/** True when this request only reads, so it may run while the app is read-only. */
export function onlyReads(method: string, path: string): boolean {
	if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
	if (path === '/auth/signout') return true; // JWT sessions: clears a cookie, writes no row
	const [, api, kind, op = ''] = path.split('/');
	if (api !== 'api') return false;
	if (kind === 'data') return DATA_READ.test(op);
	if (kind === 'runner') return RUNNER_READS.has(op);
	return false;
}

export const readOnlyHandle: Handle = ({ event, resolve }) => {
	if (env.READ_ONLY !== '1' || onlyReads(event.request.method, event.url.pathname)) {
		return resolve(event);
	}
	return json({ error: READ_ONLY_MESSAGE }, { status: 503, headers: { 'Retry-After': '300' } });
};
