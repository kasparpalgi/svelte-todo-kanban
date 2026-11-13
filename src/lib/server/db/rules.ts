/** @file src/lib/server/db/rules.ts */
// What the Postgres triggers did, as plain functions (#233). Ported from the live
// PL/pgSQL (pg_get_functiondef, 2026-11-13): generate_unique_alias,
// generate_unique_alias_for_user_todo, generate_unique_username, create_user_board and
// generate_invitation_token. The D1 ops read the taken names and pass them in.

/** `generate_unique_alias`'s cleaning: lower-case, spaces to hyphens, only [a-z0-9-_]. */
export function aliasBase(name: string, fallback: 'board' | 'todo'): string {
	const base = name
		.toLowerCase()
		.replaceAll(' ', '-')
		.replace(/[^a-z0-9\-_]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
	return base || fallback;
}

/** `generate_unique_username`'s base: the email's part before `@`, lower-cased, nothing else. */
export const usernameBase = (email: string) => email.split('@')[0].toLowerCase();

/**
 * The first free name: `base` itself, else `base` + (highest numeric suffix in use + 1).
 * `taken` may hold any names; only `base` and `base<digits>` count, as in the PL/pgSQL.
 * So `board` taken gives `board1`, and `board`, `board7` give `board8`.
 */
export function nextFree(base: string, taken: Iterable<string>): string {
	const names = new Set(taken);
	if (!names.has(base)) return base;
	let max = 0;
	for (const name of names) {
		if (!name.startsWith(base)) continue;
		const suffix = name.slice(base.length);
		if (/^[0-9]+$/.test(suffix)) max = Math.max(max, Number(suffix));
	}
	return base + (max + 1);
}

/**
 * Bounds for an index range scan over every name that starts with `base`. `LIKE 'base%'`
 * would be simpler, but D1 caps LIKE patterns at 50 bytes and a card title can be longer.
 * Every `base<digits>` sorts below `base:` (`:` follows `9`); the extra rows are filtered
 * by `nextFree`.
 */
export const prefixRange = (base: string) => [base, `${base}:`] as const;

/** Postgres `initcap`: each run of letters and digits starts upper-case, the rest lower. */
export function initcap(text: string): string {
	let out = '';
	let inWord = false;
	for (const ch of text) {
		const alnum = /[\p{L}\p{N}]/u.test(ch);
		out += alnum && !inWord ? ch.toUpperCase() : ch.toLowerCase();
		inWord = alnum;
	}
	return out;
}

/** `create_user_board`: the board every new user gets, named after their username. */
export const firstBoardName = (username: string) => `${initcap(username)}'s board`;

/** `generate_invitation_token`: base64 of 32 random bytes. */
export function invitationToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes));
}
