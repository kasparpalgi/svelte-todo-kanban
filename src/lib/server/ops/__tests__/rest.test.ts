/** @file src/lib/server/ops/__tests__/rest.test.ts */
// #230 ops: the user's own row (server-managed tokens survive a settings save), notes
// (viewers read-only), owner-only rows, expenses and invoices.
import { describe, it, expect, vi } from 'vitest';
import { getMe, mergeSettings, redact, updateMe, disconnectIntegration } from '../users';
import { createNote, getNotes, reorderNotes, updateNote } from '../notes';
import { getClients, deleteClient } from '../money';
import { getClaudeUsageCost, createUrlShortcut } from '../owned';
import { createExpense } from '../expenses';
import { createInvoice } from '../invoices';
import { OpError, type Op, type UserCtx } from '../op';

const ME = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const N = '33333333-3333-4333-8333-333333333333';
const OTHER = '44444444-4444-4444-8444-444444444444';
const opName = (doc: unknown) => String(doc).match(/(?:query|mutation)\s+(\w+)/)?.[1];

type Role = 'owner' | 'editor' | 'viewer' | 'public' | 'stranger';
const boardFor = (role: Role) => ({
	user_id: role === 'owner' ? ME : 'someone',
	is_public: role === 'public',
	board_members: role === 'editor' || role === 'viewer' ? [{ role }] : []
});

function ctx(role: Role, answers: Record<string, unknown> = {}) {
	const defaults: Record<string, unknown> = {
		GetBoardRole: { boards_by_pk: boardFor(role) },
		GetNoteBoards: { notes: [{ id: N, board_id: B }] },
		GetNotes: { notes: [] },
		CreateNote: { insert_notes: { returning: [{ id: N }] } },
		UpdateNote: { update_notes: { returning: [{ id: N }] } },
		UpdateNotes: { update_notes_many: [{ returning: [{ id: N }] }] }
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests read the variables loosely
	const db = vi.fn<(doc: unknown, vars?: any) => Promise<unknown>>(
		async (doc) => ({ ...defaults, ...answers })[opName(doc)!] ?? {}
	);
	const sent = (name: string) => db.mock.calls.filter(([doc]) => opName(doc) === name);
	return { ctx: { userId: ME, db } as unknown as UserCtx, db, sent };
}

const run = (op: Op, c: UserCtx, input: unknown) => op.run(c, op.input.parse(input));
async function status(promise: Promise<unknown>) {
	try {
		await promise;
		return 'ok';
	} catch (error) {
		if (error instanceof OpError) return error.status;
		throw error;
	}
}

describe('users', () => {
	const stored = {
		lastBoardAlias: 'old',
		tokens: { github: { encrypted: 'cipher', username: 'kp' }, groq: { api_key: 'g1' } }
	};

	it('a settings save keeps the stored GitHub token, whatever the browser sends', () => {
		const merged = mergeSettings(stored, { lastBoardAlias: 'new', tokens: {} });
		expect(merged).toEqual({
			lastBoardAlias: 'new',
			tokens: { github: { encrypted: 'cipher', username: 'kp' } }
		});
		const forged = mergeSettings(stored, { tokens: { github: { encrypted: true } } });
		expect(forged.tokens?.github).toEqual({ encrypted: 'cipher', username: 'kp' });
	});

	it('the browser manages its own Groq key', () => {
		const merged = mergeSettings(stored, { tokens: { groq: { api_key: 'g2' } } });
		expect(merged.tokens).toMatchObject({ groq: { api_key: 'g2' } });
	});

	it('never sends the ciphertext to the browser', () => {
		const shown = redact({ settings: stored });
		expect(shown.settings.tokens).toEqual({
			github: { encrypted: true, username: 'kp' },
			groq: { api_key: 'g1' }
		});
	});

	it('getMe reads only the caller and updateMe writes only the caller', async () => {
		const user = { id: ME, settings: stored };
		const { ctx: c, sent } = ctx('owner', {
			GetUsers: { users: [user] },
			UpdateUser: { update_users: { returning: [user] } }
		});
		await run(getMe, c, {});
		await run(updateMe, c, { set: { dark_mode: true, settings: { tokens: {} } } });
		expect(sent('GetUsers')[0][1].where).toEqual({ id: { _eq: ME } });
		const update = sent('UpdateUser')[0][1];
		expect(update.where).toEqual({ id: { _eq: ME } });
		expect(update._set.settings.tokens.github.encrypted).toBe('cipher');
	});

	it('updateMe refuses email and plan columns', () => {
		expect(() => updateMe.input.parse({ set: { email: 'x@y.z' } })).toThrow();
		expect(() => updateMe.input.parse({ set: { plan: 'pro' } })).toThrow();
	});

	it('disconnect drops just that token', async () => {
		const user = { id: ME, settings: stored };
		const { ctx: c, sent } = ctx('owner', {
			GetUsers: { users: [user] },
			UpdateUser: { update_users: { returning: [user] } }
		});
		await run(disconnectIntegration, c, { name: 'github' });
		expect(sent('UpdateUser')[0][1]._set.settings.tokens).toEqual({ groq: { api_key: 'g1' } });
	});
});

describe('notes', () => {
	it('everyone who sees the board reads; strangers get 403', async () => {
		for (const role of ['owner', 'viewer', 'public'] as const) {
			expect(await status(run(getNotes, ctx(role).ctx, { boardId: B }))).toBe('ok');
		}
		expect(await status(run(getNotes, ctx('stranger').ctx, { boardId: B }))).toBe(403);
	});

	it('only owners and editors write', async () => {
		const input = { boardId: B, title: 'T' };
		expect(await status(run(createNote, ctx('editor').ctx, input))).toBe('ok');
		expect(await status(run(createNote, ctx('viewer').ctx, input))).toBe(403);
		expect(await status(run(updateNote, ctx('viewer').ctx, { id: N, set: { title: 'x' } }))).toBe(
			403
		);
	});

	it('createNote records the author', async () => {
		const { ctx: c, sent } = ctx('owner');
		await run(createNote, c, { boardId: B, title: 'T' });
		expect(sent('CreateNote')[0][1].objects[0].user_id).toBe(ME);
	});

	it('a parent or a reorder across boards is refused', async () => {
		const twoBoards = {
			GetNoteBoards: {
				notes: [
					{ id: N, board_id: B },
					{ id: OTHER, board_id: 'other-board' }
				]
			}
		};
		const set = { parent_id: OTHER };
		expect(await status(run(updateNote, ctx('owner', twoBoards).ctx, { id: N, set }))).toBe(400);
		expect(await status(run(reorderNotes, ctx('owner', twoBoards).ctx, { ids: [N, OTHER] }))).toBe(
			400
		);
	});
});

describe('owner-only rows', () => {
	it('scope every read and write by the caller', async () => {
		const { ctx: c, sent } = ctx('owner', {
			GetClients: { clients: [] },
			DeleteClient: { delete_clients: { affected_rows: 0 } }
		});
		await run(getClients, c, {});
		expect(sent('GetClients')[0][1]).toEqual({ userId: ME });
		expect(await status(run(deleteClient, c, { id: N }))).toBe(404);
		expect(sent('DeleteClient')[0][1]).toEqual({ id: N, userId: ME });
	});

	it("Claude usage answers null for someone else's id without a query", async () => {
		const { ctx: c, db } = ctx('owner');
		const period = { from: '2026-11-01T00:00:00.000Z', to: '2026-12-01T00:00:00.000Z' };
		expect(await run(getClaudeUsageCost, c, { userId: OTHER, ...period })).toBeNull();
		expect(db).not.toHaveBeenCalled();
	});

	it('a taken alias is a 400 with a readable message', async () => {
		const c = ctx('owner').ctx;
		vi.mocked(c.db).mockRejectedValueOnce(new Error('Uniqueness violation'));
		const result = run(createUrlShortcut, c, { alias: 'abc', target_url: 'https://x.y' });
		await expect(result).rejects.toMatchObject({ status: 400, message: 'Alias is already taken' });
	});
});

describe('expenses', () => {
	const input = { boardId: B, amount: 10, paidBy: ME, splits: [{ user_id: OTHER, amount: 10 }] };

	it('members add expenses; public visitors do not', async () => {
		const ok = ctx('viewer', { CreateExpense: { insert_expenses_one: { id: N } } });
		expect(await status(run(createExpense, ok.ctx, input))).toBe('ok');
		expect(await status(run(createExpense, ctx('public').ctx, input))).toBe(403);
	});

	it('everyone in the split must be on the board', async () => {
		const { ctx: c, db } = ctx('owner');
		db.mockImplementation(async (doc, vars) => {
			if (opName(doc) !== 'GetBoardRole') return {};
			return { boards_by_pk: vars.userId === ME ? boardFor('owner') : boardFor('stranger') };
		});
		expect(await status(run(createExpense, c, input))).toBe(400);
	});
});

describe('invoices', () => {
	it('totals come from the cards on the board, not the browser', async () => {
		const { ctx: c, sent } = ctx('owner', {
			GetInvoiceParties: { clients: [{ id: N }], invoice_companies: [] },
			GetTodosForInvoicing: {
				todos: [
					{ id: N, title: 'A', actual_hours: 2 },
					{ id: OTHER, title: 'B', actual_hours: 1.5 }
				]
			},
			CreateInvoiceWithItems: { insert_invoices_one: { id: N } }
		});
		await run(createInvoice, c, {
			boardId: B,
			listIds: [B],
			todoIds: [N, OTHER],
			clientId: N,
			invoiceNumber: '1',
			issuedDate: '2026-11-13',
			currency: 'EUR',
			hourlyRate: 100
		});
		const where = sent('GetTodosForInvoicing')[0][1].where;
		expect(where.list).toEqual({ board_id: { _eq: B } });
		const invoice = sent('CreateInvoiceWithItems')[0][1].invoice;
		expect(invoice).toMatchObject({ user_id: ME, total_hours: 3.5, total_amount: 350 });
	});

	it("another user's client is refused", async () => {
		const { ctx: c } = ctx('owner', {
			GetInvoiceParties: { clients: [], invoice_companies: [] }
		});
		const input = {
			boardId: B,
			listIds: [B],
			todoIds: [N],
			clientId: OTHER,
			invoiceNumber: '1',
			issuedDate: '2026-11-13',
			currency: 'EUR',
			hourlyRate: 1
		};
		expect(await status(run(createInvoice, c, input))).toBe(400);
	});
});
