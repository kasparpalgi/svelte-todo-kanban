/** @file src/routes/api/upload/__tests__/upload.d1.test.ts */
// /api/upload on D1 (#258): the plan, the R2 token and the free-plan upload count all
// come from D1, and nothing reaches Hasura.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';

vi.mock('$env/dynamic/private', () => ({
	env: { DATA_BACKEND: 'd1', MAX_FILE_SIZE: '1000000', ALLOWED_FILE_TYPES: 'image/png' }
}));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
const storeFile = vi.fn(async () => ({ success: true, url: 'https://files/x.png' }));
vi.mock('$lib/server/storeFile', () => ({
	getR2Credentials: (settings: { tokens?: { r2?: unknown } } | null) => settings?.tokens?.r2 ?? null,
	storeFile: (...a: unknown[]) => storeFile(...(a as []))
}));

const { POST } = await import('../+server');

let sqlite: DatabaseSync;

beforeEach(() => {
	storeFile.mockClear();
	sqlite = migratedSqlite();
	sqlite.exec(`
		INSERT INTO users (id, username, plan) VALUES ('free', 'free', 'free'), ('r2', 'r2', 'free');
		INSERT INTO user_secrets (user_id, name, value) VALUES ('r2', 'r2', '{"encrypted":"k"}');
		INSERT INTO boards (id, user_id, name, alias) VALUES ('b1', 'free', 'B', 'b');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES ('l1', 'b1', 'L', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias) VALUES ('t1', 'free', 'l1', 'T', 't');`);
});

const upload = (userId: string) => {
	const form = new FormData();
	form.set('file', new File(['png'], 'a.png', { type: 'image/png' }));
	return POST({
		request: new Request('http://x/api/upload', { method: 'POST', body: form }),
		locals: { auth: async () => ({ user: { id: userId } }) },
		platform: { env: { DB: sqliteD1(sqlite) } }
	} as never);
};

const fill = (n: number) => {
	for (let i = 0; i < n; i++) sqlite.exec(`INSERT INTO uploads (id, todo_id, url) VALUES ('u${i}', 't1', 'x')`);
};

describe('POST /api/upload on D1', () => {
	it('stores the file while a free user is under the cap', async () => {
		fill(9);
		expect((await upload('free')).status).toBe(200);
		expect(storeFile).toHaveBeenCalledWith(expect.any(File), 'free', null);
	});

	it('answers 402 once a free user has 10 uploads', async () => {
		fill(10);
		expect((await upload('free')).status).toBe(402);
		expect(storeFile).not.toHaveBeenCalled();
	});

	it('uses the user’s own R2 key from user_secrets, with no cap', async () => {
		expect((await upload('r2')).status).toBe(200);
		expect(storeFile).toHaveBeenCalledWith(expect.any(File), 'r2', { encrypted: 'k' });
	});
});
