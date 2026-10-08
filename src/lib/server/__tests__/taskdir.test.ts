/** @file src/lib/server/__tests__/taskdir.test.ts */
import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/github', () => ({ githubRequest: vi.fn() }));

const { toArchive } = await import('../taskdir');

describe('toArchive', () => {
	const names = ['051-a-DONE.md', '052-seo-DONE.md', '053-b-DONE.md', '053-b.log', 'README.md'];

	it('moves nothing while the issue number is free', () => {
		expect(toArchive(names, 54)).toEqual([]);
	});

	it('moves the finished tasks numbered n and up, with their logs, when n is taken', () => {
		expect(toArchive(names, 52)).toEqual(['052-seo-DONE.md', '053-b-DONE.md', '053-b.log']);
	});

	it('moves only -DONE tasks: drafts, -TODO and -BLOCKED stay put', () => {
		const mixed = ['052-a-DONE.md', '053-b.md', '054-c-TODO.md', '055-d-BLOCKED.md', '056-e.log'];
		expect(toArchive(mixed, 52)).toEqual(['052-a-DONE.md']);
	});

	it('moves nothing when an unfinished task holds the number — moving would not free it', () => {
		expect(toArchive(['052-x.md', '053-y-DONE.md'], 52)).toEqual([]);
		expect(toArchive(['052-y-TODO.md', '053-z-DONE.md'], 52)).toEqual([]);
		expect(toArchive(['052-a-DONE.md', '052-b-BLOCKED.md'], 52)).toEqual([]);
	});

	it("never moves the card's own draft, nor counts it as holding the number", () => {
		expect(toArchive(['052-me.md'], 52, '052-me.md')).toEqual([]);
		expect(toArchive(['052-x-DONE.md', '053-me.md'], 52, '053-me.md')).toEqual(['052-x-DONE.md']);
	});
});
