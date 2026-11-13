/** @file src/lib/server/__tests__/access.test.ts */
import { describe, it, expect, vi } from 'vitest';
import { boardRole, canEdit, canRead } from '../access';
import type { Ctx } from '../ops/op';

const ME = 'me';

type Board = { user_id: string; is_public: boolean; board_members: { role: string }[] };

function ctxWith(board: Board | null, userId: string | null = ME) {
	const db = vi.fn<(doc: unknown, vars: unknown) => Promise<{ boards_by_pk: Board | null }>>(
		async () => ({ boards_by_pk: board })
	);
	return { ctx: { userId, db } as unknown as Ctx, db };
}

const board = (over: Partial<Board> = {}): Board => ({
	user_id: 'someone',
	is_public: false,
	board_members: [],
	...over
});

describe('boardRole', () => {
	it.each([
		['the owner', board({ user_id: ME }), 'owner'],
		['an owner member', board({ board_members: [{ role: 'owner' }] }), 'owner'],
		['an editor', board({ board_members: [{ role: 'editor' }] }), 'editor'],
		['a viewer', board({ board_members: [{ role: 'viewer' }] }), 'viewer'],
		['anyone, on a public board', board({ is_public: true }), 'public'],
		[
			'a member of a public board, by their role',
			board({ is_public: true, board_members: [{ role: 'editor' }] }),
			'editor'
		],
		['a stranger, on a private board', board(), null],
		['anyone, for a board that does not exist', null, null]
	])('%s', async (_, row, expected) => {
		expect(await boardRole(ctxWith(row).ctx, 'b1')).toBe(expected);
	});

	it('gives a signed-out caller a public board only', async () => {
		const { ctx, db } = ctxWith(board({ user_id: ME, is_public: true }), null);
		expect(await boardRole(ctx, 'b1')).toBe('public');
		expect(db.mock.calls[0][1]).toEqual({
			boardId: 'b1',
			userId: '00000000-0000-0000-0000-000000000000'
		});
	});

	it('looks a board up once per request', async () => {
		const { ctx, db } = ctxWith(board({ user_id: ME }));
		await Promise.all([boardRole(ctx, 'b1'), boardRole(ctx, 'b1')]);
		await boardRole(ctx, 'b2');
		expect(db).toHaveBeenCalledTimes(2);

		// A new request is a new ctx: no stale role carried over.
		await boardRole({ ...ctx }, 'b1');
		expect(db).toHaveBeenCalledTimes(3);
	});
});

describe('canRead / canEdit', () => {
	it('lets every role read and only owners and editors edit', () => {
		expect(['owner', 'editor', 'viewer', 'public'].every((r) => canRead(r as never))).toBe(true);
		expect(canRead(null)).toBe(false);
		expect(canEdit('owner') && canEdit('editor')).toBe(true);
		expect(canEdit('viewer') || canEdit('public') || canEdit(null)).toBe(false);
	});
});
