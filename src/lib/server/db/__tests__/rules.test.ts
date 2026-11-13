/** @file src/lib/server/db/__tests__/rules.test.ts */
// The Postgres trigger rules, ported (#233). Expected values are what the live PL/pgSQL
// gives for the same input.
import { describe, expect, it } from 'vitest';
import {
	aliasBase,
	firstBoardName,
	initcap,
	invitationToken,
	nextFree,
	prefixRange,
	usernameBase
} from '../rules';

describe('aliasBase (generate_unique_alias cleaning)', () => {
	it.each([
		['My Board', 'my-board'],
		['  Hello   World  ', 'hello-world'],
		['Ülo & Co: 2026!', 'lo-co-2026'],
		['snake_case-and--dashes', 'snake_case-and-dashes'],
		['Kaspar’s board', 'kaspars-board'],
		['tab\there', 'tabhere']
	])('%j → %j', (name, alias) => expect(aliasBase(name, 'board')).toBe(alias));

	it('falls back when nothing is left', () => {
		expect(aliasBase('!!! ???', 'board')).toBe('board');
		expect(aliasBase('💼', 'todo')).toBe('todo');
	});
});

describe('nextFree (the numeric suffix)', () => {
	it('keeps a free base', () => expect(nextFree('work', ['work-2', 'other'])).toBe('work'));
	it('adds 1 for the first clash', () => expect(nextFree('work', ['work'])).toBe('work1'));
	it('takes the highest suffix + 1, not the first gap', () =>
		expect(nextFree('work', ['work', 'work1', 'work7'])).toBe('work8'));
	it('ignores names that only start with the base', () =>
		expect(nextFree('work', ['work', 'work-2', 'workshop', 'work2x'])).toBe('work1'));
	it('reads leading zeros as a number', () => expect(nextFree('a', ['a', 'a007'])).toBe('a8'));
});

it('prefixRange covers every base<digits> and nothing before the base', () => {
	const [from, to] = prefixRange('work');
	for (const name of ['work', 'work1', 'work99999', 'work-2']) {
		expect(name >= from && name < to).toBe(true);
	}
	expect('wor' >= from).toBe(false);
	expect('worl' < to && 'worl' >= from).toBe(false);
});

it('usernameBase lower-cases the part before @ and nothing else', () => {
	expect(usernameBase('John.Doe+x@Example.com')).toBe('john.doe+x');
});

describe('first board (create_user_board)', () => {
	it.each([
		['kaspar', 'Kaspar'],
		['john.doe', 'John.Doe'],
		['JOHN_DOE', 'John_Doe'],
		['2fast4you', '2fast4you'],
		['mari-liis', 'Mari-Liis']
	])('initcap(%j) = %j', (input, out) => expect(initcap(input)).toBe(out));

	it('names the board after the username', () =>
		expect(firstBoardName('john.doe')).toBe("John.Doe's board"));
});

it('invitationToken is base64 of 32 random bytes', () => {
	const token = invitationToken();
	expect(token).toMatch(/^[A-Za-z0-9+/]{43}=$/);
	expect(invitationToken()).not.toBe(token);
});
