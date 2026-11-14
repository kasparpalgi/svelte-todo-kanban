/** @file src/lib/server/__tests__/readOnly.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const env: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env }));
const { onlyReads, readOnlyHandle, READ_ONLY_MESSAGE } = await import('../readOnly');
const { runnerOps } = await import('../runner');

const run = (method: string, path: string) => {
	const resolve = vi.fn(async () => new Response('ok'));
	const event = {
		request: new Request(`http://x${path}`, { method }),
		url: new URL(`http://x${path}`)
	};
	return { response: readOnlyHandle({ event, resolve } as never), resolve };
};

describe('onlyReads', () => {
	it('lets pages and read ops through', () => {
		expect(onlyReads('GET', '/en/kaspar/work')).toBe(true);
		for (const op of ['getBoards', 'poll', 'searchTodos', 'countInvoicesIssued']) {
			expect(onlyReads('POST', `/api/data/${op}`)).toBe(true);
		}
		expect(onlyReads('POST', '/api/runner/cards')).toBe(true);
		expect(onlyReads('POST', '/auth/signout')).toBe(true);
	});

	it('stops every write', () => {
		for (const op of ['createTodo', 'updateTodo', 'createLog', 'markNotificationsRead']) {
			expect(onlyReads('POST', `/api/data/${op}`)).toBe(false);
		}
		expect(onlyReads('POST', '/api/runner/claimCard')).toBe(false);
		expect(onlyReads('POST', '/api/runner/upload')).toBe(false);
		expect(onlyReads('POST', '/api/github/webhook')).toBe(false);
		expect(onlyReads('POST', '/auth/callback/credentials')).toBe(false);
		expect(onlyReads('PATCH', '/api/github/update-issue')).toBe(false);
	});

	it('lets through only runner ops that exist', () => {
		for (const op of ['board', 'boards', 'cards', 'comments', 'uploads', 'pricing', 'usage']) {
			expect(runnerOps).toHaveProperty(op);
		}
	});
});

describe('readOnlyHandle', () => {
	beforeEach(() => delete env.READ_ONLY);

	it('does nothing while READ_ONLY is unset', async () => {
		const { response, resolve } = run('POST', '/api/data/createTodo');
		expect(await (await response).text()).toBe('ok');
		expect(resolve).toHaveBeenCalled();
	});

	it('answers a write with 503 and the message while READ_ONLY=1', async () => {
		env.READ_ONLY = '1';
		const { response, resolve } = run('POST', '/api/data/createTodo');
		const res = await response;
		expect(res.status).toBe(503);
		expect(res.headers.get('retry-after')).toBe('300');
		expect(await res.json()).toEqual({ error: READ_ONLY_MESSAGE });
		expect(resolve).not.toHaveBeenCalled();
	});

	it('still serves reads while READ_ONLY=1', async () => {
		env.READ_ONLY = '1';
		const { resolve } = run('POST', '/api/data/getBoards');
		expect(resolve).toHaveBeenCalled();
	});
});
