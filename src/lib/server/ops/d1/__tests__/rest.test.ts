/** @file src/lib/server/ops/d1/__tests__/rest.test.ts */
// The D1 user, note, money, expense and owned-row ops on a real migrated SQLite: the
// access rules of their Hasura ops and what each write leaves behind (#257).
import { beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { d1, type D1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { ops, type OpName } from '../../index';
import { OpError } from '../../op';
import { runOp } from '../../run';

const ME = 'a0000000-0000-4000-8000-000000000001';
const ANN = 'a0000000-0000-4000-8000-000000000002';
const VIC = 'a0000000-0000-4000-8000-000000000003';
const ZED = 'a0000000-0000-4000-8000-000000000004';
const B = 'b0000000-0000-4000-8000-000000000001';
const OTHER = 'b0000000-0000-4000-8000-000000000002';
const L = 'c0000000-0000-4000-8000-000000000001';
const N = (n: number) => `e0000000-0000-4000-8000-00000000000${n}`;
const C = 'f0000000-0000-4000-8000-000000000001';
const T = (n: number) => `d0000000-0000-4000-8000-00000000000${n}`;

let sqlite: DatabaseSync;
let db: D1;

beforeEach(() => {
	sqlite = migratedSqlite();
	db = d1(sqliteD1(sqlite));
	sqlite.exec(`
		INSERT INTO users (id, username, name, settings) VALUES
			('${ME}', 'me', 'Me', '{"tokens":{"groq":"g"}}'), ('${ANN}', 'ann', 'ann', '{}'),
			('${VIC}', 'vic', NULL, '{}'), ('${ZED}', 'zed', 'Zed', '{}');
		INSERT INTO user_secrets (user_id, name, value) VALUES
			('${ME}', 'github', '{"encrypted":"secret","username":"me"}');
		INSERT INTO boards (id, user_id, name, alias) VALUES
			('${B}', '${ME}', 'Mine', 'mine'), ('${OTHER}', '${ZED}', 'Zed', 'zed');
		INSERT INTO board_members (id, board_id, user_id, role) VALUES
			('m1', '${B}', '${ANN}', 'editor'), ('m2', '${B}', '${VIC}', 'viewer');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES ('${L}', '${B}', 'Todo', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias, sort_order, actual_hours) VALUES
			('${T(1)}', '${ME}', '${L}', 'Two hours', 't1', 1, 2), ('${T(2)}', '${ME}', '${L}', 'None', 't2', 2, 0);
		INSERT INTO notes (id, board_id, user_id, title, sort_order) VALUES
			('${N(1)}', '${B}', '${ME}', 'One', 0), ('${N(2)}', '${B}', '${ME}', 'Two', 1),
			('${N(3)}', '${OTHER}', '${ZED}', 'Zed', 0);
		INSERT INTO clients (id, user_id, name) VALUES ('${C}', '${ME}', 'Client');
		INSERT INTO claude_usage (id, session_id, user_id, model, cost_usd, created_at) VALUES
			('u1', 's1', '${ME}', 'm', 0.1, '2026-11-02T00:00:00.000Z'),
			('u2', 's2', '${ME}', 'm', 0.2, '2026-11-03T00:00:00.000Z'),
			('u3', 's3', '${ME}', 'm', 5, '2026-12-01T00:00:00.000Z');`);
});

const run = (name: OpName, input: unknown, userId = ME) =>
	runOp(name, { userId, db: async () => ({}) as never, d1: db }, ops[name].input.parse(input));

async function status(promise: Promise<unknown>) {
	try {
		await promise;
		return 200;
	} catch (e) {
		if (e instanceof OpError) return e.status;
		throw e;
	}
}

const rows = (sql: string) => sqlite.prepare(sql).all();
type Me = { settings: { tokens: Record<string, unknown> } };

describe('users', () => {
	it('getMe folds the secrets into settings.tokens, redacted', async () => {
		const me = (await run('getMe', {})) as Me;
		expect(me.settings.tokens).toEqual({ groq: 'g', github: { encrypted: true, username: 'me' } });
	});

	it('updateMe never stores a server token in settings; disconnect drops the secret', async () => {
		const settings = { theme: 'x', tokens: { groq: 'new', github: { encrypted: true } } };
		const me = (await run('updateMe', { set: { settings, name: 'New' } })) as Me;
		expect(me.settings.tokens.github).toEqual({ encrypted: true, username: 'me' });
		expect(rows(`SELECT settings FROM users WHERE id = '${ME}'`)).toEqual([
			{ settings: '{"theme":"x","tokens":{"groq":"new"}}' }
		]);
		const after = (await run('disconnectIntegration', { name: 'github' })) as Me;
		expect(after.settings.tokens).toEqual({ groq: 'new' });
		expect(rows(`SELECT * FROM user_secrets`)).toEqual([]);
	});

	it('getBoardPeople: the caller and who they share a board with, nulls last', async () => {
		const people = (await run('getBoardPeople', {}, ANN)) as { id: string }[];
		expect(people.map((p) => p.id)).toEqual([ANN, ME, VIC]);
		expect(await run('getBoardPeople', {}, ZED)).toEqual([
			{ id: ZED, name: 'Zed', username: 'zed', image: null }
		]);
	});
});

describe('notes', () => {
	it('viewers read, editors write, and a parent must be on the same board', async () => {
		expect(((await run('getNotes', { boardId: B }, VIC)) as unknown[]).length).toBe(2);
		expect(await status(run('createNote', { boardId: B, title: 'x' }, VIC))).toBe(403);
		expect(await status(run('getNotes', { boardId: OTHER }))).toBe(403);
		const bad = { boardId: B, title: 'x', parentId: N(3) };
		expect(await status(run('createNote', bad))).toBe(400);
		const child = (await run('createNote', { boardId: B, title: 'Kid', parentId: N(1) }, ANN)) as {
			id: string;
		};
		const notes = (await run('getNotes', { boardId: B })) as {
			id: string;
			subnotes: { id: string }[];
		}[];
		expect(notes.find((n) => n.id === N(1))?.subnotes.map((s) => s.id)).toEqual([child.id]);
	});

	it('reorderNotes returns the notes in the given order; deleting a note takes its images', async () => {
		const sorted = (await run('reorderNotes', { ids: [N(2), N(1)] })) as { sort_order: number }[];
		expect(sorted.map((n) => n.sort_order)).toEqual([0, 1]);
		expect(await status(run('reorderNotes', { ids: [N(1), N(3)] }))).toBe(400);
		const up = (await run('createNoteUpload', { noteId: N(1), url: 'https://x/y.png' })) as {
			note_id: string;
		};
		expect(up.note_id).toBe(N(1));
		expect(await run('deleteNote', { id: N(1) })).toEqual({ deleted: true });
		expect(rows(`SELECT * FROM note_uploads`)).toEqual([]);
	});
});

describe('money', () => {
	it("is the owner's only", async () => {
		expect(((await run('getClients', {}, ZED)) as unknown[]).length).toBe(0);
		expect(await status(run('updateClient', { id: C, set: { name: 'x' } }, ZED))).toBe(404);
		expect(await status(run('deleteClient', { id: C }, ZED))).toBe(404);
	});

	it('createInvoice bills the cards with hours, at the given rate', async () => {
		const invoice = (todoIds: string[], clientId = C) =>
			run('createInvoice', {
				...{ boardId: B, listIds: [L], todoIds, clientId, invoiceNumber: '1' },
				...{ issuedDate: '2026-11-17', currency: 'EUR', hourlyRate: 50 }
			});
		expect(await status(invoice([T(2)]))).toBe(400); // no hours logged
		expect(await status(invoice([T(1)], B))).toBe(400); // not a client of mine
		const made = (await invoice([T(1), T(2)])) as {
			total_amount: number;
			items: { amount: number }[];
			client: { name: string };
		};
		expect([made.total_amount, made.items.length, made.client.name]).toEqual([100, 1, 'Client']);
		expect(await run('countInvoicesIssued', { today: '2026-11-17' })).toBe(1);
		expect(await run('deleteInvoice', { id: (made as unknown as { id: string }).id })).toEqual({
			deleted: true
		});
		expect(rows(`SELECT * FROM invoice_items`)).toEqual([]);
	});
});

describe('expenses', () => {
	it('everyone in an expense is on the board; only the payer deletes it', async () => {
		const splits = [{ user_id: ZED, amount: 5 }];
		const base = { boardId: B, amount: 10, paidBy: ME };
		expect(await status(run('createExpense', { ...base, splits }))).toBe(400);
		const made = (await run('createExpense', {
			...base,
			splits: [{ user_id: ANN, amount: 5 }]
		})) as { id: string; expense_splits: { user: { username: string } }[] };
		expect(made.expense_splits[0].user.username).toBe('ann');
		expect(((await run('getExpenses', {}, ANN)) as unknown[]).length).toBe(1);
		expect(await status(run('deleteExpense', { id: made.id }, ANN))).toBe(404);
		expect(await run('deleteExpense', { id: made.id })).toEqual({ deleted: true });
		expect(await run('getExpenses', { boardId: B })).toEqual([]);
	});
});

describe('owned rows', () => {
	it('a taken alias is a 400; a known push endpoint moves to the new user', async () => {
		await run('createUrlShortcut', { alias: 'docs', target_url: 'https://x' });
		expect(await status(run('createUrlShortcut', { alias: 'docs', target_url: 'y' }, ANN))).toBe(
			400
		);
		const sub = { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' };
		await run('savePushSubscription', sub);
		await run('savePushSubscription', { ...sub, auth: 'b' }, ANN);
		expect(rows(`SELECT user_id, auth FROM push_subscriptions`)).toEqual([
			{ user_id: ANN, auth: 'b' }
		]);
	});

	it("getClaudeUsageCost sums the caller's period; null for anyone else", async () => {
		const period = { userId: ME, from: '2026-11-01T00:00:00Z', to: '2026-12-01T00:00:00Z' };
		expect(await run('getClaudeUsageCost', period)).toBeCloseTo(0.3);
		expect(await run('getClaudeUsageCost', period, ANN)).toBeNull();
	});
});
