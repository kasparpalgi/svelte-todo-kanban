/** @file src/lib/server/__tests__/taskdir.test.ts */
import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/github', () => ({ githubRequest: vi.fn() }));

const { toArchive } = await import('../taskdir');

describe('toArchive', () => {
	const names = ['051-a-DONE.md', '052-seo.md', '053-b-DONE.md', '053-b.log', 'README.md'];

	it('moves nothing while the issue number is free', () => {
		expect(toArchive(names, 54)).toEqual([]);
	});

	it('moves the number and everything above it when the number is taken', () => {
		expect(toArchive(names, 52)).toEqual(['052-seo.md', '053-b-DONE.md', '053-b.log']);
	});

	it("never moves the card's own draft, nor counts it as taking the number", () => {
		expect(toArchive(['052-me.md'], 52, '052-me.md')).toEqual([]);
		expect(toArchive(['052-x.md', '053-me.md'], 52, '053-me.md')).toEqual(['052-x.md']);
	});

	it("leaves another card's queued -TODO.md in place", () => {
		expect(toArchive(['052-x.md', '060-y-TODO.md'], 52)).toEqual(['052-x.md']);
		expect(toArchive(['052-y-TODO.md', '053-z.md'], 52)).toEqual([]);
	});
});
