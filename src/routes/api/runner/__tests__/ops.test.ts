/** @file src/routes/api/runner/__tests__/ops.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const TOKEN = 'r'.repeat(40);
const serverRequest = vi.fn();
vi.mock('$env/dynamic/private', () => ({ env: { RUNNER_API_TOKEN: TOKEN } }));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: (...a: unknown[]) => serverRequest(...a)
}));

const { POST } = await import('../[op]/+server');

const CARD = '33333333-3333-4333-8333-333333333333';

async function post(op: string, body: unknown, token = TOKEN) {
	const request = new Request(`http://x/api/runner/${op}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(body)
	});
	const response = await POST({ params: { op }, request } as never);
	return { status: response.status, body: await response.json() };
}

describe('POST /api/runner/[op]', () => {
	beforeEach(() => {
		serverRequest.mockReset();
	});

	it('answers 401 without the runner token, before anything else', async () => {
		expect((await post('board', { repo: 'x' }, 'wrong')).status).toBe(401);
		expect((await post('nope', {}, '')).status).toBe(401);
		expect(serverRequest).not.toHaveBeenCalled();
	});

	it('answers 404 for an unknown op and 400 for bad input', async () => {
		expect((await post('constructor', {})).status).toBe(404);
		expect((await post('claimCard', { id: 'x' })).status).toBe(400);
		expect((await post('updateCard', { id: CARD, set: { title: 'x' } })).status).toBe(400);
		expect(serverRequest).not.toHaveBeenCalled();
	});

	it('finds a board by a substring of its github JSON', async () => {
		serverRequest.mockResolvedValue({ boards: [{ id: 'b', user_id: 'u', lists: [] }] });
		const { body } = await post('board', { repo: 'owner/repo' });
		expect(body.data).toEqual({ id: 'b', user_id: 'u', lists: [] });
		expect(serverRequest.mock.calls[0][1]).toEqual({ repo: '%owner/repo%' });
	});

	it('claims only a free card or one this machine holds', async () => {
		serverRequest.mockResolvedValue({ update_todos: { affected_rows: 1 } });
		const { body } = await post('claimCard', { id: CARD, machine: 'mac' });
		expect(body.data).toEqual({ claimed: true });
		const [, vars] = serverRequest.mock.calls[0];
		expect(vars.set).toEqual({ agent_machine: 'mac' });
		expect(vars.where._or).toEqual([
			{ agent_machine: { _is_null: true } },
			{ agent_machine: { _ilike: 'mac' } }
		]);
	});

	it('lists cards by ids or by paths, never both', async () => {
		serverRequest.mockResolvedValue({ todos: [] });
		expect((await post('cards', { ids: [CARD], paths: ['a'] })).status).toBe(400);
		await post('cards', { paths: ['.claude/todo/1-x-TODO.md'] });
		expect(serverRequest.mock.calls[0][1]).toEqual({
			where: { task_file_path: { _in: ['.claude/todo/1-x-TODO.md'] } }
		});
	});

	it('narrows comments to an author and an exact body', async () => {
		serverRequest.mockResolvedValue({ comments: [] });
		await post('comments', { todoId: CARD, userId: CARD, content: 'done' });
		expect(serverRequest.mock.calls[0][1].where).toEqual({
			todo_id: { _eq: CARD },
			user_id: { _eq: CARD },
			content: { _eq: 'done' }
		});
	});

	it('lists the usage rows since a moment', async () => {
		serverRequest.mockResolvedValue({ claude_usage: [{ model: 'm' }] });
		const { body } = await post('usage', { since: '2026-11-01T00:00:00Z' });
		expect(body.data).toEqual([{ model: 'm' }]);
		expect(serverRequest.mock.calls[0][1]).toEqual({ since: '2026-11-01T00:00:00Z' });
	});

	it('hides a database error behind a 500', async () => {
		serverRequest.mockRejectedValue(new Error('secret detail'));
		const { status, body } = await post('boards', {});
		expect(status).toBe(500);
		expect(body.error).toBe('boards failed');
	});
});
