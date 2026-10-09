/** @file src/routes/api/github/__tests__/repos.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const githubRequest = vi.fn();
let token: string | null = 'gh-token';

vi.mock('$lib/server/github', () => ({
	getGithubToken: async () => token,
	githubRequest: (...args: unknown[]) => githubRequest(...args)
}));

const { GET } = await import('../repos/+server');

const call = (userId = 'user-1') =>
	GET({ url: new URL(`http://x/api/github/repos?userId=${userId}`) } as never);

const repos = (n: number, prefix: string) =>
	Array.from({ length: n }, (_, i) => ({
		full_name: `${prefix}/r${i}`,
		description: null,
		private: true
	}));

describe('GET /api/github/repos', () => {
	beforeEach(() => {
		githubRequest.mockReset();
		token = 'gh-token';
	});

	it('pages past the first 100 repos', async () => {
		githubRequest.mockResolvedValueOnce(repos(100, 'a')).mockResolvedValueOnce(repos(3, 'org'));

		const body = await (await call()).json();

		expect(githubRequest).toHaveBeenCalledTimes(2);
		expect(githubRequest.mock.calls[1][0]).toContain('page=2');
		expect(body).toHaveLength(103);
		expect(body[102]).toEqual({ full_name: 'org/r2', description: null });
	});

	it('stops after one call when the first page is short', async () => {
		githubRequest.mockResolvedValueOnce(repos(5, 'a'));
		await call();
		expect(githubRequest).toHaveBeenCalledTimes(1);
	});

	it('rejects users without a GitHub connection', async () => {
		token = null;
		await expect(call()).rejects.toMatchObject({ status: 400 });
	});
});
