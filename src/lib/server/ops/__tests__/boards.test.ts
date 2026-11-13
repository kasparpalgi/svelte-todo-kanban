/** @file src/lib/server/ops/__tests__/boards.test.ts */
// Access rules of the board ops (#228): viewers are read-only, strangers get 403.
import { describe, it, expect, vi } from 'vitest';
import { createBoard, deleteBoard, getBoard, getBoards, updateBoard } from '../boards';
import { createList, deleteList, getLists, updateList } from '../lists';
import { createLabel, deleteLabel, updateLabel } from '../labels';
import { getBoardMembers, removeBoardMember, updateBoardMember } from '../members';
import {
	acceptInvitation,
	cancelInvitation,
	createBoardInvitation,
	declineInvitation,
	getBoardInvitations
} from '../invitations';
import { OpError, type Op, type UserCtx } from '../op';

const B = '11111111-1111-4111-8111-111111111111';
const ROW = '22222222-2222-4222-8222-222222222222';
const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

type Role = 'owner' | 'editor' | 'viewer' | 'public' | 'stranger';

/** The caller ('me') has `role` on board B; every row belongs to B. */
function ctx(role: Role, answers: Record<string, unknown> = {}) {
	const board = {
		user_id: role === 'owner' ? 'me' : 'someone',
		is_public: role === 'public',
		board_members: role === 'editor' || role === 'viewer' ? [{ role }] : []
	};
	const defaults: Record<string, unknown> = {
		GetBoardRole: { boards_by_pk: board },
		GetUserIdentity: { users_by_pk: { email: 'me@example.com', username: 'me' } },
		GetListBoard: { lists_by_pk: { board_id: B } },
		GetLabelBoard: { labels_by_pk: { board_id: B } },
		GetMemberBoard: { board_members_by_pk: { board_id: B, user_id: 'other' } },
		GetInvitationBoard: { board_invitations_by_pk: { board_id: B } },
		GetInvitation: { board_invitations: [] }
	};
	const db = vi.fn<(doc: unknown, vars?: unknown) => Promise<unknown>>(
		async (doc) => ({ ...defaults, ...answers })[opName(doc)!] ?? {}
	);
	return { ctx: { userId: 'me', db } as unknown as UserCtx, db };
}

async function run(op: Op, c: UserCtx, input: unknown) {
	return op.run(c, op.input.parse(input));
}

async function status(promise: Promise<unknown>) {
	try {
		await promise;
		return 'ok';
	} catch (error) {
		return error instanceof OpError ? error.status : error;
	}
}

const writes: [string, Op, unknown][] = [
	['updateBoard', updateBoard as Op, { id: B, set: { name: 'x' } }],
	['createList', createList as Op, { boardId: B, name: 'x' }],
	['updateList', updateList as Op, { id: ROW, set: { sort_order: 2 } }],
	['deleteList', deleteList as Op, { id: ROW }],
	['createLabel', createLabel as Op, { boardId: B, name: 'x', color: '#fff' }],
	['updateLabel', updateLabel as Op, { id: ROW, set: { color: '#000' } }],
	['deleteLabel', deleteLabel as Op, { id: ROW }]
];

const ownerOnly: [string, Op, unknown][] = [
	['deleteBoard', deleteBoard as Op, { id: B }],
	['updateBoardMember', updateBoardMember as Op, { id: ROW, role: 'editor' }],
	['removeBoardMember', removeBoardMember as Op, { id: ROW }],
	[
		'createBoardInvitation',
		createBoardInvitation as Op,
		{ boardId: B, invitee: 'a@b.c', role: 'viewer' }
	],
	['cancelInvitation', cancelInvitation as Op, { id: ROW }]
];

describe('board ops: who may write', () => {
	it.each(writes)(
		'%s: a viewer gets 403, a stranger 403, an editor gets through',
		async (_, op, input) => {
			expect(await status(run(op, ctx('viewer').ctx, input))).toBe(403);
			expect(await status(run(op, ctx('public').ctx, input))).toBe(403);
			expect(await status(run(op, ctx('stranger').ctx, input))).toBe(403);
			expect(await status(run(op, ctx('editor').ctx, input))).not.toBe(403);
		}
	);

	it.each(ownerOnly)('%s: only an owner', async (_, op, input) => {
		expect(await status(run(op, ctx('editor').ctx, input))).toBe(403);
		expect(await status(run(op, ctx('viewer').ctx, input))).toBe(403);
		expect(await status(run(op, ctx('owner').ctx, input))).not.toBe(403);
	});

	it('a member may leave the board themselves', async () => {
		const { ctx: c } = ctx('viewer', {
			GetMemberBoard: { board_members_by_pk: { board_id: B, user_id: 'me' } },
			RemoveBoardMember: { delete_board_members: { affected_rows: 1 } }
		});
		expect(await run(removeBoardMember as Op, c, { id: ROW })).toEqual({ deleted: true });
	});

	it('moving a list needs edit rights on the target board too', async () => {
		const { ctx: c, db } = ctx('editor');
		const other = '33333333-3333-4333-8333-333333333333';
		db.mockImplementation(async (doc: unknown, vars?: unknown) => {
			const op = opName(doc);
			if (op === 'GetListBoard') return { lists_by_pk: { board_id: B } };
			if (op === 'GetBoardRole') {
				const isB = (vars as { boardId: string }).boardId === B;
				return {
					boards_by_pk: {
						user_id: 'x',
						is_public: false,
						board_members: isB ? [{ role: 'editor' }] : []
					}
				};
			}
			return {};
		});
		expect(await status(run(updateList as Op, c, { id: ROW, set: { board_id: other } }))).toBe(403);
	});

	it('creates a board owned by the caller, whatever else was sent', async () => {
		const { ctx: c, db } = ctx('owner', {
			CreateBoard: { insert_boards: { returning: [{ id: B }] } }
		});
		await run(createBoard as Op, c, { name: ' New ', sort_order: 3 });
		expect(db.mock.calls[0][1]).toEqual({
			objects: [{ name: 'New', sort_order: 3, user_id: 'me' }]
		});
		expect(createBoard.input.safeParse({ name: 'x', user_id: 'other' }).data).not.toHaveProperty(
			'user_id'
		);
	});

	it('refuses board fields the app never sets (e.g. a new owner)', () => {
		expect(updateBoard.input.safeParse({ id: B, set: { user_id: 'me' } }).success).toBe(false);
	});
});

describe('board ops: who may read', () => {
	it('a non-member gets 403 for a private board’s members and invitations', async () => {
		expect(await status(run(getBoardMembers as Op, ctx('stranger').ctx, { boardId: B }))).toBe(403);
		expect(await status(run(getBoardInvitations as Op, ctx('public').ctx, { boardId: B }))).toBe(
			403
		);
		expect(await status(run(getBoardMembers as Op, ctx('public').ctx, { boardId: B }))).toBe('ok');
	});

	it('getBoard hides a private board from a stranger, shows it to an invitee', async () => {
		const boards = { GetBoards: { boards: [{ id: B, alias: 'b' }] } };
		expect(await run(getBoard as Op, ctx('stranger', boards).ctx, { alias: 'b' })).toBeNull();

		const invited = { ...boards, GetInvitation: { board_invitations: [{ id: ROW }] } };
		expect(await run(getBoard as Op, ctx('stranger', invited).ctx, { alias: 'b' })).toEqual({
			id: B,
			alias: 'b'
		});
		expect(await run(getBoard as Op, ctx('public', boards).ctx, { alias: 'b' })).toEqual({
			id: B,
			alias: 'b'
		});
	});

	it('getBoards scopes to own, member and pending-invited boards, never public ones', async () => {
		const { ctx: c, db } = ctx('owner', { GetBoards: { boards: [] } });
		await run(getBoards as Op, c, {});
		const where = (db.mock.calls.at(-1)![1] as { where: unknown }).where;
		expect(where).toEqual({
			_and: [
				{ archived_at: { _is_null: true } },
				{
					_or: [
						{ user_id: { _eq: 'me' } },
						{ board_members: { user_id: { _eq: 'me' } } },
						{
							board_invitations: {
								_and: [
									{ status: { _eq: 'pending' } },
									{
										_or: [
											{ invitee_email: { _eq: 'me@example.com' } },
											{ invitee_username: { _eq: 'me' } }
										]
									}
								]
							}
						}
					]
				}
			]
		});
	});

	it('getLists adds a readable public board, but not a private one', async () => {
		const lists = { GetLists: { lists: [] } };
		const pub = ctx('public', lists);
		await run(getLists as Op, pub.ctx, { boardId: B });
		expect(JSON.stringify(pub.db.mock.calls.at(-1)![1])).toContain(`"board_id":{"_eq":"${B}"}`);

		const priv = ctx('stranger', lists);
		await run(getLists as Op, priv.ctx, { boardId: B });
		expect(JSON.stringify(priv.db.mock.calls.at(-1)![1])).not.toContain(B);
	});
});

describe('invitations', () => {
	const invitation = (over = {}) => ({
		id: ROW,
		board_id: B,
		role: 'viewer',
		status: 'pending',
		expires_at: '2099-01-01T00:00:00Z',
		board: { id: B, alias: 'b', user: { username: 'o' } },
		...over
	});

	it('accept joins with the invited role and marks it accepted, in one mutation', async () => {
		const { ctx: c, db } = ctx('stranger', {
			GetInvitation: { board_invitations: [invitation()] }
		});
		expect(await run(acceptInvitation as Op, c, { id: ROW })).toEqual(invitation().board);
		const accept = db.mock.calls.find((call) => opName(call[0]) === 'AcceptInvitation');
		expect(accept?.[1]).toEqual({
			id: ROW,
			member: { board_id: B, user_id: 'me', role: 'viewer' }
		});
	});

	it('accept only looks at invitations addressed to the caller', async () => {
		const { ctx: c, db } = ctx('stranger', { GetInvitation: { board_invitations: [] } });
		expect(await status(run(acceptInvitation as Op, c, { token: 'tok' }))).toBe(404);
		const where = JSON.stringify(
			db.mock.calls.find((call) => opName(call[0]) === 'GetInvitation')?.[1]
		);
		expect(where).toContain('me@example.com');
		expect(where).toContain('"token":{"_eq":"tok"}');
	});

	it('an expired or declined invitation cannot be accepted or declined', async () => {
		for (const over of [{ expires_at: '2020-01-01T00:00:00Z' }, { status: 'declined' }]) {
			const { ctx: c } = ctx('stranger', {
				GetInvitation: { board_invitations: [invitation(over)] }
			});
			expect(await status(run(acceptInvitation as Op, c, { id: ROW }))).toBe(400);
			expect(await status(run(declineInvitation as Op, c, { id: ROW }))).toBe(400);
		}
	});

	it('the inviter is the caller', async () => {
		const { ctx: c, db } = ctx('owner', {
			CreateBoardInvitation: { insert_board_invitations: { returning: [{ id: ROW }] } }
		});
		await run(createBoardInvitation as Op, c, { boardId: B, invitee: 'bob', role: 'editor' });
		const insert = db.mock.calls.find((call) => opName(call[0]) === 'CreateBoardInvitation');
		expect(insert?.[1]).toEqual({
			objects: [
				{
					board_id: B,
					inviter_id: 'me',
					role: 'editor',
					token: expect.stringMatching(/^[0-9a-f]{32}$/),
					invitee_username: 'bob'
				}
			]
		});
	});
});
