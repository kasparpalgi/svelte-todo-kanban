/** @file src/lib/server/ops/__tests__/ops.test.ts */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLog, getLogs } from '../logs';
import { poll } from '../poll';
import type { UserCtx } from '../op';

const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

function ctx(answers: Record<string, unknown> = {}) {
	const db = vi.fn<(doc: unknown, vars?: unknown) => Promise<unknown>>(
		async (doc) => answers[opName(doc)!] ?? {}
	);
	return { ctx: { userId: 'me', db } as unknown as UserCtx, db };
}

const log = { level: 'error', component: 'Test', message: 'boom' };

afterEach(() => vi.restoreAllMocks());

describe('createLog', () => {
	it('saves the batch as the session user, whatever the client sent', async () => {
		const { ctx: c, db } = ctx();
		const input = createLog.input.parse({ logs: [{ ...log, user_id: 'someone-else' }] });

		expect(await createLog.run(c, input)).toEqual({ saved: 1 });
		expect(db).toHaveBeenCalledTimes(1);
		expect(db.mock.calls[0][1]).toEqual({ logs: [{ ...log, user_id: 'me' }] });
	});

	it('cuts long text instead of refusing the batch', () => {
		const input = createLog.input.parse({ logs: [{ ...log, message: 'x'.repeat(5_000) }] });
		expect(input.logs[0].message).toHaveLength(2_000);
	});

	it('refuses empty and oversized batches', () => {
		expect(createLog.input.safeParse({ logs: [] }).success).toBe(false);
		expect(createLog.input.safeParse({ logs: Array(51).fill(log) }).success).toBe(false);
	});

	it('deletes logs older than 30 days on about 1 in 100 writes', async () => {
		const { ctx: c, db } = ctx();
		vi.spyOn(Math, 'random').mockReturnValue(0.005);
		await createLog.run(c, createLog.input.parse({ logs: [log] }));

		expect(opName(db.mock.calls[1][0])).toBe('DeleteOldLogs');
		const before = Date.parse((db.mock.calls[1][1] as { before: string }).before);
		expect(Date.now() - before).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -4);
	});

	it('still reports the logs saved when the clean-up fails', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { ctx: c, db } = ctx();
		db.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('timeout'));

		expect(await createLog.run(c, createLog.input.parse({ logs: [log] }))).toEqual({ saved: 1 });
	});
});

describe('getLogs', () => {
	it('reads only the session user’s logs, with the page’s filters', async () => {
		const { ctx: c, db } = ctx();
		const input = getLogs.input.parse({
			level: 'warn',
			component: 'Store',
			search: 'slow',
			from: '2026-11-01T00:00:00.000Z',
			limit: 20,
			offset: 40
		});
		await getLogs.run(c, input);

		expect(db.mock.calls[0][1]).toEqual({
			where: {
				user_id: { _eq: 'me' },
				level: { _eq: 'warn' },
				component: { _ilike: '%Store%' },
				message: { _ilike: '%slow%' },
				timestamp: { _gte: '2026-11-01T00:00:00.000Z' }
			},
			order_by: [{ timestamp: 'desc' }],
			limit: 20,
			offset: 40
		});
	});
});

describe('poll', () => {
	const unread = { notifications_aggregate: { aggregate: { count: 3 } } };
	const boardRow = (role: string | null) => ({
		boards_by_pk: { user_id: 'owner', is_public: false, board_members: role ? [{ role }] : [] }
	});
	const BOARD = '22222222-2222-4222-8222-222222222222';
	const cards = (title: string) => ({
		...unread,
		boards_by_pk: { updated_at: '1' },
		lists: [{ id: 'l1', name: 'Todo', sort_order: 1, updated_at: '1' }],
		todos: [{ id: 'a', updated_at: title }]
	});

	it('returns only the unread count without a board', async () => {
		const { ctx: c, db } = ctx({ PollUnread: unread });
		expect(await poll.run(c, {})).toEqual({ board: null, unread: 3 });
		expect(db).toHaveBeenCalledTimes(1);
	});

	it('gives no fingerprint for a board the user cannot read', async () => {
		const { ctx: c, db } = ctx({ GetBoardRole: boardRow(null), PollUnread: unread });
		expect(await poll.run(c, { boardId: BOARD })).toEqual({ board: null, unread: 3 });
		expect(db.mock.calls.map(([doc]) => opName(doc))).toEqual(['GetBoardRole', 'PollUnread']);
	});

	it('fingerprints a readable board: stable, and different after a change', async () => {
		const first = await poll.run(
			ctx({ GetBoardRole: boardRow('viewer'), PollBoard: cards('1') }).ctx,
			{ boardId: BOARD }
		);
		const again = await poll.run(
			ctx({ GetBoardRole: boardRow('viewer'), PollBoard: cards('1') }).ctx,
			{ boardId: BOARD }
		);
		const changed = await poll.run(
			ctx({ GetBoardRole: boardRow('viewer'), PollBoard: cards('2') }).ctx,
			{ boardId: BOARD }
		);

		expect(first.unread).toBe(3);
		expect(first.board).toMatch(/^[0-9a-f]{24}$/);
		expect(again.board).toBe(first.board);
		expect(changed.board).not.toBe(first.board);
	});

	it('leaves the unread count out of the fingerprint', async () => {
		const other = { ...cards('1'), notifications_aggregate: { aggregate: { count: 9 } } };
		const a = await poll.run(ctx({ GetBoardRole: boardRow('editor'), PollBoard: cards('1') }).ctx, {
			boardId: BOARD
		});
		const b = await poll.run(ctx({ GetBoardRole: boardRow('editor'), PollBoard: other }).ctx, {
			boardId: BOARD
		});
		expect(b.board).toBe(a.board);
		expect(b.unread).toBe(9);
	});
});
