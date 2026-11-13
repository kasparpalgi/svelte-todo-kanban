/** @file src/routes/api/data/__tests__/data.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const serverRequest = vi.fn();
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: (...a: unknown[]) => serverRequest(...a)
}));

const { POST } = await import('../[op]/+server');

const USER = '11111111-1111-4111-8111-111111111111';
const BOARD = '22222222-2222-4222-8222-222222222222';

async function post(op: string, body: unknown, userId: string | null = USER) {
	const request = new Request(`http://x/api/data/${op}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
	const locals = { auth: async () => (userId ? { user: { id: userId } } : null) };
	const response = await POST({ params: { op }, request, locals } as never);
	return { status: response.status, body: await response.json() };
}

describe('POST /api/data/[op]', () => {
	beforeEach(() => {
		serverRequest.mockReset();
	});

	it('answers 404 for an unknown op, including inherited object keys', async () => {
		expect((await post('dropTables', {})).status).toBe(404);
		expect((await post('constructor', {})).status).toBe(404);
		expect(serverRequest).not.toHaveBeenCalled();
	});

	it('answers 401 without a session', async () => {
		const { status, body } = await post('getLogs', {}, null);
		expect(status).toBe(401);
		expect(body.error).toBe('Authentication required');
		expect(serverRequest).not.toHaveBeenCalled();
	});

	it('answers 400 for input that fails the schema, or a body that is not JSON', async () => {
		const bad = await post('getLogs', { limit: 5000 });
		expect(bad.status).toBe(400);
		expect(bad.body.error).toContain('limit');
		expect((await post('getLogs', 'not json')).status).toBe(400);
		expect((await post('poll', { boardId: 'nope' })).status).toBe(400);
		expect(serverRequest).not.toHaveBeenCalled();
	});

	it('runs the op as the session user and returns { data }', async () => {
		const result = { logs: [], logs_aggregate: { aggregate: { count: 0 } } };
		serverRequest.mockResolvedValue(result);

		const { status, body } = await post('getLogs', {});

		expect(status).toBe(200);
		expect(body).toEqual({ data: result });
		expect(serverRequest.mock.calls[0][1].where).toEqual({ user_id: { _eq: USER } });
	});

	it('answers 500 with a generic message when the database fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		serverRequest.mockRejectedValue(new Error('connection refused at 10.0.0.1'));

		const { status, body } = await post('poll', { boardId: BOARD });

		expect(status).toBe(500);
		expect(body).toEqual({ error: 'poll failed' });
	});
});
