/** @file src/lib/server/pbkdf2.ts */
// Password hashes the Worker can check within Workers Free's 10 ms CPU (#226, owner
// decision 2): PBKDF2-SHA256 through WebCrypto, stored as `pbkdf2$<iterations>$<salt>$<hash>`.
// 10,000 iterations cost about 5 ms. The count is stored per hash, so it can be raised
// later and old hashes still verify.

const ITERATIONS = 10_000;
const PREFIX = 'pbkdf2$';

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
		key,
		256
	);
	return new Uint8Array(bits);
}

export const isPbkdf2 = (hash: string | null | undefined) => !!hash?.startsWith(PREFIX);

export async function hashPbkdf2(password: string, iterations = ITERATIONS) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derive(password, salt, iterations);
	return `${PREFIX}${iterations}$${toB64(salt)}$${toB64(hash)}`;
}

/** True when `password` matches a `pbkdf2$…` hash. A malformed hash never matches. */
export async function checkPbkdf2(password: string, stored: string) {
	const [, rounds, salt, expected] = stored.split('$');
	const iterations = Number(rounds);
	if (!Number.isInteger(iterations) || iterations < 1 || !salt || !expected) return false;
	const want = fromB64(expected);
	const got = await derive(password, fromB64(salt), iterations);
	if (got.length !== want.length) return false;
	let diff = 0;
	for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
	return diff === 0;
}
