/** @file src/lib/server/__tests__/taskdir.test.ts */
import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/github', () => ({ githubRequest: vi.fn() }));

const { toArchive, toDelete } = await import('../taskdir');

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

describe('commitTree', () => {
	it('rebuilds on the new head when another commit won the race', async () => {
		const { githubRequest } = await import('$lib/server/github');
		const { commitTree } = await import('../taskdir');
		const gh = vi.mocked(githubRequest);
		gh.mockReset();
		let patches = 0;
		gh.mockImplementation(async (path: string, _t: string, init?: RequestInit) => {
			if (path === '/repos/o/r') return { default_branch: 'main' };
			if (path.includes('/ref/heads/')) return { object: { sha: `head${patches}` } };
			if (path.includes('/commits/')) return { tree: { sha: 't' } };
			if (path.endsWith('/trees')) return { sha: 'nt' };
			if (path.endsWith('/commits')) return { sha: `c${patches}` };
			if (init?.method === 'PATCH' && patches++ === 0)
				throw new Error('GitHub API error (422): {"message":"Update is not a fast forward"}');
			return {};
		});

		await commitTree('o/r', 'tok', 'msg', []);

		const commits = gh.mock.calls.filter(([p]) => p.endsWith('/commits'));
		expect(commits.map(([, , i]) => JSON.parse(i!.body as string).parents)).toEqual([
			['head0'],
			['head1']
		]);
	});

	it('does not retry other errors', async () => {
		const { githubRequest } = await import('$lib/server/github');
		const { commitTree } = await import('../taskdir');
		const gh = vi.mocked(githubRequest);
		gh.mockReset();
		gh.mockImplementation(async (path: string, _t: string, init?: RequestInit) => {
			if (path === '/repos/o/r') return { default_branch: 'main' };
			if (path.includes('/ref/heads/')) return { object: { sha: 'h' } };
			if (path.includes('/commits/')) return { tree: { sha: 't' } };
			if (init?.method === 'PATCH') throw new Error('GitHub API error (403): Forbidden');
			return { sha: 'x' };
		});

		await expect(commitTree('o/r', 'tok', 'msg', [])).rejects.toThrow('403');
		expect(gh.mock.calls.filter(([, , i]) => i?.method === 'PATCH')).toHaveLength(1);
	});
});

describe('toDelete', () => {
	it("deletes a draft card's draft and nothing else", () => {
		const names = ['078-test.md', '079-x-TODO.md', '077-y.md'];
		expect(toDelete(names, '078-test.md')).toEqual(['078-test.md']);
	});

	it('deletes a queued -TODO file with the log of an earlier attempt', () => {
		expect(toDelete(['080-a-TODO.md', '080-a.log', '080-ab.md'], '080-a-TODO.md')).toEqual([
			'080-a-TODO.md',
			'080-a.log'
		]);
	});

	it('keeps a finished run: -DONE or -BLOCKED, its log and any leftover', () => {
		expect(toDelete(['081-a-DONE.md', '081-a.log'], '081-a-TODO.md')).toEqual([]);
		expect(toDelete(['082-b-BLOCKED.md', '082-b-TODO.md'], '082-b-BLOCKED.md')).toEqual([]);
	});

	it('deletes nothing when the file is already gone', () => {
		expect(toDelete(['083-c-DONE.md'], '084-d.md')).toEqual([]);
	});
});
