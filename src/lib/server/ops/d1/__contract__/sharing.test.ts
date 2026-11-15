/** @file src/lib/server/ops/d1/__contract__/sharing.test.ts */
// Contract tests for the list, label, member and invitation ops (#241). Same setup as
// contract.test.ts. CONTRACT_WRITES=1 also writes on the test user's tests-board on both
// sides and cleans up afterwards (production has the rows for seconds).
import { describe, expect, it } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import { ops, type OpName } from '../../index';
import { runOp } from '../../run';
import { compare } from './cases';
import { normalize } from './compare';
import { local } from './local';

const on = !!process.env.CONTRACT;
const VOLATILE = /^(id|token|created_at|updated_at|expires_at)$/;

describe.skipIf(!on)('D1 sharing ops equal Hasura', () => {
	const { sqlite, db } = on ? local() : ({} as ReturnType<typeof local>);
	const all = <T>(sql: string) => (on ? (sqlite.prepare(sql).all() as T[]) : []);
	const users = all<{ id: string }>(`SELECT id FROM users`);
	const boards = all<{ id: string; user_id: string }>(`SELECT id, user_id FROM boards`);
	const test = all<{ id: string; board: string }>(
		`SELECT u.id, b.id AS board FROM users u JOIN boards b ON b.user_id = u.id
		 WHERE u.username = 'test' AND b.alias = 'tests-board'`
	)[0];

	it('getLists and getMyInvitations for every user', { timeout: 120_000 }, async () => {
		const cases = users.flatMap(({ id }) => [
			{ op: 'getLists' as const, userId: id, input: {} },
			{ op: 'getMyInvitations' as const, userId: id, input: {} }
		]);
		expect(await compare(cases, db)).toEqual([]);
	});

	it(
		'per board: lists, members and invitations as owner and stranger',
		{ timeout: 120_000 },
		async () => {
			const cases = boards.flatMap((b) =>
				[b.user_id, test.id].flatMap((userId) =>
					(['getLists', 'getBoardMembers', 'getBoardInvitations'] as const).map((op) => ({
						op,
						userId,
						input: { boardId: b.id }
					}))
				)
			);
			expect(await compare(cases, db)).toEqual([]);
		}
	);

	it.skipIf(!process.env.CONTRACT_WRITES)('writes as the test user', async () => {
		const ctx = (side: number) => ({ userId: test.id, db: serverRequest, ...(side && { d1: db }) });
		const strip = (v: unknown) =>
			JSON.parse(JSON.stringify(normalize(v), (k, x) => (VOLATILE.test(k) ? undefined : x)));
		/** Runs `op` on Hasura (0) and D1 (1), each with its own input; expects equal JSON. */
		async function pair<T = { id: string; token: string }>(
			op: OpName,
			input: (side: number) => unknown
		) {
			const out = (await Promise.all(
				[0, 1].map((s) => runOp(op, ctx(s), ops[op].input.parse(input(s))))
			)) as T[];
			expect(strip(out[1]), op).toEqual(strip(out[0]));
			return out;
		}
		const boardId = test.board;
		const name = `Contract ${Date.now()}`;

		const list = await pair('createList', () => ({ boardId, name, sort_order: 9 }));
		await pair('updateList', (s) => ({
			id: list[s].id,
			set: { name: `${name} 2`, sort_order: 8 }
		}));
		const label = await pair('createLabel', () => ({ boardId, name, color: '#123456' }));
		await pair('updateLabel', (s) => ({ id: label[s].id, set: { color: '#654321' } }));
		await pair('deleteLabel', (s) => ({ id: label[s].id }));

		const members = await pair<{ id: string; user_id: string }[]>('getBoardMembers', () => ({
			boardId
		}));
		const me = members.map((m) => m.find((x) => x.user_id === test.id)!);
		await pair('updateBoardMember', (s) => ({ id: me[s].id, role: 'owner' }));

		// The owner invites themself: accepting keeps them owner and marks it accepted.
		const accept = await pair('createBoardInvitation', () => ({
			boardId,
			invitee: 'test',
			role: 'editor'
		}));
		const decline = await pair('createBoardInvitation', () => ({
			boardId,
			invitee: 'test',
			role: 'viewer'
		}));
		await pair('getBoardInvitations', () => ({ boardId }));
		await pair('getMyInvitations', () => ({}));
		await pair('acceptInvitation', (s) => ({ token: accept[s].token }));
		await pair('declineInvitation', (s) => ({ id: decline[s].id }));
		await pair('cancelInvitation', (s) => ({ id: accept[s].id }));
		await pair('cancelInvitation', (s) => ({ id: decline[s].id }));
		await pair('deleteList', (s) => ({ id: list[s].id }));
	});
});
