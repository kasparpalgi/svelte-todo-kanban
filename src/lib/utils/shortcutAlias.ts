/** @file src/lib/utils/shortcutAlias.ts */

export const RESERVED_ALIASES = new Set<string>([
	// Languages
	'en',
	'cs',
	'et',
	// Top-level app routes (must mirror src/routes top-level dirs)
	'api',
	'dggc',
	'extension-auth',
	'invoices',
	'logout',
	'penon',
	'podcasts',
	'signin',
	'signout',
	'terms',
	// Reserved feature/section aliases under language routes
	'shortener',
	'splitwise',
	'logs',
	'settings',
	'stats',
	'mail'
]);

const ALIAS_REGEX = /^[A-Za-z0-9._-]+$/;
const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateRandomAlias(length = 8): string {
	let out = '';
	const arr = new Uint32Array(length);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(arr);
		for (let i = 0; i < length; i++) {
			out += RANDOM_ALPHABET[arr[i] % RANDOM_ALPHABET.length];
		}
	} else {
		for (let i = 0; i < length; i++) {
			out += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
		}
	}
	return out;
}

export type AliasValidation = { ok: true } | { ok: false; error: string };

export function validateAlias(alias: string): AliasValidation {
	const trimmed = alias?.trim() ?? '';
	if (!trimmed) {
		return { ok: false, error: 'empty' };
	}
	if (trimmed.length > 64) {
		return { ok: false, error: 'too_long' };
	}
	if (!ALIAS_REGEX.test(trimmed)) {
		return { ok: false, error: 'invalid_chars' };
	}
	if (RESERVED_ALIASES.has(trimmed.toLowerCase())) {
		return { ok: false, error: 'reserved' };
	}
	return { ok: true };
}

export function normalizeTargetUrl(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) return trimmed;
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return `http://${trimmed}`;
}
