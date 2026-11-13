/** @file src/lib/utils/__tests__/filterBoards.test.ts */
import { describe, it, expect } from 'vitest';
import { filterBoards } from '../filterBoards';

const boards = [
	{ name: 'Todzz', alias: 'todzz', user: { username: 'kaspar' } },
	{ name: 'Home Chores', alias: 'home-chores', user: { username: 'anna' } },
	{ name: 'Work', alias: 'work', user: null }
];

describe('filterBoards', () => {
	it('returns every board for an empty or blank query', () => {
		expect(filterBoards(boards, '')).toEqual(boards);
		expect(filterBoards(boards, '   ')).toEqual(boards);
	});

	it('matches name case-insensitively and keeps order', () => {
		expect(filterBoards(boards, 'HOME').map((b) => b.name)).toEqual(['Home Chores']);
		expect(filterBoards(boards, 'o').map((b) => b.name)).toEqual(['Todzz', 'Home Chores', 'Work']);
	});

	it('matches alias and owner username', () => {
		expect(filterBoards(boards, 'home-ch').map((b) => b.name)).toEqual(['Home Chores']);
		expect(filterBoards(boards, 'anna').map((b) => b.name)).toEqual(['Home Chores']);
	});

	it('returns nothing when no board matches', () => {
		expect(filterBoards(boards, 'zzzz-nope')).toEqual([]);
	});
});
