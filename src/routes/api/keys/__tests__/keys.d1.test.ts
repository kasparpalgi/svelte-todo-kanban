/** @file src/routes/api/keys/__tests__/keys.d1.test.ts */
// BYO keys on D1 (#265): one `user_secrets` row per key, the shape `disconnectIntegration` deletes.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';

vi.mock('$env/dynamic/private', () => ({ env: { DATA_BACKEND: 'd1' } }));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
vi.mock('$lib/utils/crypto', () => ({ encryptToken: (s: string) => `enc:${s}` }));

const { POST } = await import('../+server');

let sqlite: DatabaseSync;
beforeEach(() => {
	sqlite = migratedSqlite();
	sqlite.exec(`INSERT INTO users (id, username) VALUES ('u1', 'u1');
		INSERT INTO user_secrets (user_id, name, value) VALUES ('u1', 'github', '{"encrypted":"gh"}')`);
});

const save = (body: object) =>
	POST({
		request: new Request('http://x/api/keys', { method: 'POST', body: JSON.stringify(body) }),
		locals: { auth: async () => ({ user: { id: 'u1' } }) },
		platform: { env: { DB: sqliteD1(sqlite) } }
	} as never);
const names = () =>
	(sqlite.prepare('SELECT name FROM user_secrets ORDER BY name').all() as { name: string }[]).map(
		(r) => r.name
	);

describe('POST /api/keys on D1', () => {
	it('saves and removes the openai key without touching other secrets', async () => {
		const res = await save({ openai: ' sk-1 ' });
		expect(await res.json()).toEqual({ success: true, openaiSet: true, r2Set: false });
		const stored = sqlite.prepare("SELECT value FROM user_secrets WHERE name='openai'").get() as {
			value: string;
		};
		expect(JSON.parse(stored.value)).toEqual({ encrypted: 'enc:sk-1' });
		expect(names()).toEqual(['github', 'openai']);

		await save({ openai: '' });
		expect(names()).toEqual(['github']);
	});

	it('saves r2 only when complete', async () => {
		const r2 = {
			accountId: 'a',
			accessKeyId: 'k',
			secretAccessKey: 's',
			bucket: 'b',
			publicBaseUrl: 'u'
		};
		expect((await (await save({ r2 })).json()).r2Set).toBe(true);
		expect((await (await save({ r2: { ...r2, bucket: '' } })).json()).r2Set).toBe(false);
		expect(names()).toEqual(['github']);
	});
});
