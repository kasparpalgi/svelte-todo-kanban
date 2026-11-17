/** @file src/lib/server/ops/d1/__contract__/rest.test.ts */
// Contract tests for the user, note, money, expense and owned-row ops (#257). Same setup
// as contract.test.ts. CONTRACT_WRITES=1 also writes as the test user on tests-board on
// both sides and deletes what it made (production has the rows for seconds).
import { describe, expect, it } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import { ops, type OpName } from '../../index';
import { runOp } from '../../run';
import { compare, type Case } from './cases';
import { normalize } from './compare';
import { local } from './local';

const on = !!process.env.CONTRACT;
const VOLATILE =
	/^(id|note_id|parent_id|todo_id|list_id|client_id|company_id|invoice_id|expense_id|created_at|updated_at)$/;

describe.skipIf(!on)('D1 user, note and money ops equal Hasura', () => {
	const { sqlite, db } = on ? local() : ({} as ReturnType<typeof local>);
	const all = <T>(sql: string) => (on ? (sqlite.prepare(sql).all() as T[]) : []);
	const users = all<{ id: string }>(`SELECT id FROM users`).map((u) => u.id);
	const boards = all<{ id: string; user_id: string }>(`SELECT id, user_id FROM boards`);
	const test = all<{ id: string; board: string }>(
		`SELECT u.id, b.id AS board FROM users u JOIN boards b ON b.user_id = u.id
		 WHERE u.username = 'test' AND b.alias = 'tests-board'`
	)[0];
	const long = { timeout: 600_000 };
	const each = (op: OpName, input: unknown = {}): Case[] =>
		users.map((userId) => ({ op, userId, input }));
	const perBoard = (op: OpName, input: (b: { id: string }) => unknown): Case[] =>
		boards.flatMap((b) => [
			{ op, userId: b.user_id, input: input(b) },
			{ op, userId: test.id, input: input(b) }
		]);

	it('getMe, getBoardPeople and the owned rows for every user', long, async () => {
		const today = new Date().toISOString().slice(0, 10);
		const cases = [
			...each('getMe'),
			...each('getBoardPeople'),
			...each('getClients'),
			...each('getInvoiceCompanies'),
			...each('getInvoices'),
			...each('countInvoicesIssued', { today }),
			...each('getExpenses'),
			...each('getUrlShortcuts')
		];
		expect(await compare(cases, db)).toEqual([]);
	});

	it('getNotes, getExpenses, getInvoices and billable cards for every board', long, async () => {
		const lists = all<{ board_id: string; ids: string }>(
			`SELECT board_id, json_group_array(id) AS ids FROM lists GROUP BY board_id`
		);
		const listIds = new Map(lists.map((l) => [l.board_id, JSON.parse(l.ids) as string[]]));
		const cases = [
			...perBoard('getNotes', (b) => ({ boardId: b.id })),
			...perBoard('getExpenses', (b) => ({ boardId: b.id })),
			...perBoard('getInvoices', (b) => ({ boardId: b.id })),
			...perBoard('getTodosForInvoicing', (b) => ({
				boardId: b.id,
				listIds: (listIds.get(b.id) ?? []).slice(0, 500)
			}))
		];
		expect(await compare(cases, db)).toEqual([]);
	});

	it('getClaudeUsageCost for every user, all time and per month', long, async () => {
		// Up to the newest copied row: Hasura may have newer ones.
		const to = all<{ t: string }>(`SELECT max(created_at) AS t FROM claude_usage`)[0].t;
		const periods = [
			['2020-01-01T00:00:00Z', to],
			['2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z'],
			['2026-11-01T00:00:00Z', to]
		];
		const cases = users.flatMap((userId) =>
			periods.map(([from, to]) => ({
				op: 'getClaudeUsageCost' as const,
				userId,
				input: { userId, from, to }
			}))
		);
		cases.push({ ...cases[0], userId: test.id }); // someone else's: null
		expect(await compare(cases, db)).toEqual([]);
	});

	it.skipIf(!process.env.CONTRACT_WRITES)('writes as the test user', long, async () => {
		const ctx = (side: number) => ({ userId: test.id, db: serverRequest, ...(side && { d1: db }) });
		const strip = (v: unknown) =>
			JSON.parse(JSON.stringify(normalize(v), (k, x) => (VOLATILE.test(k) ? undefined : x)));
		/** Runs `op` on Hasura (0) and D1 (1), each with its own input; expects equal JSON. */
		async function pair<T = { id: string }>(op: OpName, input: (side: number) => unknown) {
			const out = (await Promise.all(
				[0, 1].map((s) => runOp(op, ctx(s), ops[op].input.parse(input(s))))
			)) as T[];
			expect(strip(out[1]), op).toEqual(strip(out[0]));
			return out;
		}
		const name = `Contract ${Date.now()}`;
		const board = test.board;
		// Undone in reverse in `finally`, so a failed step leaves nothing on production.
		const undo: [OpName, (s: number) => unknown][] = [];
		const made = async (op: OpName, input: (s: number) => unknown, del: OpName) => {
			const out = await pair<Record<string, string>>(op, input);
			undo.push([del, (s) => ({ id: out[s].id })]);
			return out;
		};
		try {
			const me = await pair<{ dark_mode: boolean }>('getMe', () => ({}));
			await pair('updateMe', () => ({ set: { dark_mode: me[0].dark_mode } }));
			await pair('disconnectIntegration', () => ({ name: 'google_calendar' }));

			const note = await made('createNote', () => ({ boardId: board, title: name }), 'deleteNote');
			const kid = await pair('createNote', (s) => ({
				boardId: board,
				title: name,
				parentId: note[s].id
			}));
			await pair('updateNote', (s) => ({
				id: kid[s].id,
				set: { content: '<p>x</p>', sort_order: 3 }
			}));
			const image = await pair('createNoteUpload', (s) => ({
				noteId: note[s].id,
				url: 'https://x/y.png'
			}));
			await pair('getNotes', () => ({ boardId: board }));
			await pair('deleteNoteUpload', (s) => ({ id: image[s].id }));
			await pair('reorderNotes', (s) => ({ ids: [kid[s].id, note[s].id] }));
			await pair('deleteNote', (s) => ({ id: note[s].id }));

			const client = await made(
				'createClient',
				() => ({ name, email: 'c@x.ee', default_rate: 50 }),
				'deleteClient'
			);
			const company = await made(
				'createInvoiceCompany',
				() => ({ name, vat_rate: 22 }),
				'deleteInvoiceCompany'
			);
			await pair('updateInvoiceCompany', (s) => ({ id: company[s].id, set: { iban: 'EE12' } }));
			await pair('updateClient', (s) => ({ id: client[s].id, set: { phone: '+372' } }));
			const list = await made(
				'createList',
				() => ({ boardId: board, name, sort_order: 9 }),
				'deleteList'
			);
			const card = await pair('createTodo', (s) => ({
				listId: list[s].id,
				title: name,
				sort_order: 1
			}));
			await pair('updateTodo', (s) => ({ id: card[s].id, set: { actual_hours: 2.5 } }));
			await pair('getTodosForInvoicing', (s) => ({ boardId: board, listIds: [list[s].id] }));
			const invoice = await made(
				'createInvoice',
				(s) => ({
					...{ boardId: board, listIds: [list[s].id], todoIds: [card[s].id] },
					...{ clientId: client[s].id, companyId: company[s].id, invoiceNumber: name },
					...{ issuedDate: '2026-11-17', currency: 'EUR', hourlyRate: 40 }
				}),
				'deleteInvoice'
			);
			await pair('countInvoicesIssued', () => ({ today: '2026-11-17' }));
			await pair('updateInvoiceStatus', (s) => ({ id: invoice[s].id, status: 'sent' }));
			await pair('getInvoices', () => ({ boardId: board }));
			await pair('deleteInvoice', (s) => ({ id: invoice[s].id }));
			await pair('deleteClient', (s) => ({ id: client[s].id }));
			await pair('deleteInvoiceCompany', (s) => ({ id: company[s].id }));

			// Soft-deleted: the row stays (with this description) on both sides.
			const splits = [{ user_id: test.id, amount: 12 }];
			const expense = await pair('createExpense', () => ({
				...{ boardId: board, amount: 12, paidBy: test.id, description: name, splits }
			}));
			await pair('getExpenses', () => ({ boardId: board }));
			await pair('deleteExpense', (s) => ({ id: expense[s].id }));

			const alias = `contract-${Date.now()}`;
			const link = await made(
				'createUrlShortcut',
				() => ({ alias, target_url: 'https://x.ee' }),
				'deleteUrlShortcut'
			);
			await pair('updateUrlShortcut', (s) => ({
				id: link[s].id,
				set: { target_url: 'https://y.ee' }
			}));
			await pair('getUrlShortcuts', () => ({}));
			await pair('deleteUrlShortcut', (s) => ({ id: link[s].id }));
			const push = { endpoint: `https://push.example.com/${alias}`, p256dh: 'k', auth: 'a' };
			undo.push(['deletePushSubscription', () => ({ endpoint: push.endpoint })]);
			await pair('savePushSubscription', () => push);
			await pair('deletePushSubscription', () => ({ endpoint: push.endpoint }));
		} finally {
			for (const [op, input] of undo.reverse()) {
				await Promise.all([0, 1].map((s) => runOp(op, ctx(s), input(s)).catch(() => null)));
			}
		}
	});
});
