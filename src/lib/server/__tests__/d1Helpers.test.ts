/** @file src/lib/server/__tests__/d1Helpers.test.ts */
// The D1 branch of each server helper that used to call Hasura itself (#258), on a real
// migrated SQLite. The Hasura client fails the test if anything reaches it.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';

vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
vi.mock('$lib/utils/crypto', () => ({ decryptToken: (s: string) => `plain:${s}` }));
const sendNotification = vi.fn();
vi.mock('web-push', () => ({
	default: {
		setVapidDetails: () => {},
		sendNotification: (...a: unknown[]) => sendNotification(...a)
	}
}));

import { d1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import type { UserCtx } from '$lib/server/ops/op';
import { boardAndCard } from '../boardCard';
import { getGithubToken } from '../github';
import { postNews } from '../news';
import { getPlanContext } from '../plan';
import { sendPushToAll } from '../push';
import { followShortcut } from '../shortcut';
import { getTopBoardPath, userLocale } from '../topBoardPath';

const B1 = 'b0000000-0000-4000-8000-000000000001';
const L1 = 'c0000000-0000-4000-8000-000000000001';
const T1 = 'd0000000-0000-4000-8000-000000000001';

let sqlite: DatabaseSync;
let ctx: UserCtx;

beforeEach(() => {
	sendNotification.mockReset();
	sqlite = migratedSqlite();
	ctx = { userId: 'me', db: async () => ({}) as never, d1: d1(sqliteD1(sqlite)) };
	sqlite.exec(`
		INSERT INTO users (id, username, email, locale, plan, settings) VALUES
			('me', 'me', 'me@example.com', 'en', 'paid', '{"tokens":{"groq":{"encrypted":"g"}}}'),
			('ann', 'ann', 'ann@example.com', 'cs', 'free', '{}');
		INSERT INTO user_secrets (user_id, name, value) VALUES
			('me', 'github', '{"encrypted":"gh"}'), ('me', 'r2', '{"encrypted":"r2"}');
		INSERT INTO boards (id, user_id, name, alias) VALUES ('${B1}', 'me', 'Mine', 'mine');
		INSERT INTO board_members (id, board_id, user_id, role) VALUES ('m1', '${B1}', 'me', 'owner');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES ('${L1}', '${B1}', 'Todo', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias, content) VALUES
			('${T1}', 'me', '${L1}', 'First', 'first', 'Body');
		INSERT INTO uploads (id, todo_id, url) VALUES ('u1', '${T1}', 'https://x/a.png');
		INSERT INTO url_shortcuts (id, user_id, alias, target_url) VALUES ('s1', 'me', 'gh', 'https://github.com');
		INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES
			('p1', 'me', 'https://push/live', 'k', 'a'), ('p2', 'ann', 'https://push/dead', 'k', 'a');`);
});

const one = (q: string) => sqlite.prepare(q).get() as Record<string, unknown>;

describe('tokens and plan', () => {
	it('reads the GitHub token from user_secrets', async () => {
		expect(await getGithubToken(ctx, 'me')).toBe('plain:gh');
		expect(await getGithubToken(ctx, 'ann')).toBeNull();
	});

	it('merges user_secrets into settings.tokens, beside the browser’s own groq key', async () => {
		const plan = await getPlanContext(ctx, 'me');
		expect(plan).toMatchObject({ plan: 'paid', isPaid: true, userId: 'me' });
		expect(plan?.settings?.tokens).toEqual({
			groq: { encrypted: 'g' },
			github: { encrypted: 'gh' },
			r2: { encrypted: 'r2' }
		});
		expect(await getPlanContext(ctx, 'nobody')).toBeNull();
	});
});

describe('landing', () => {
	it('reads the locale and lands on the own board', async () => {
		expect(await userLocale(ctx, 'ann')).toBe('cs');
		expect(await getTopBoardPath(ctx, { user: { id: 'me' } })).toBe('/en/me/mine');
		expect(await getTopBoardPath(ctx, { user: { id: 'ann' } })).toBeNull();
	});

	it('finds a board and its card by alias for the OG tags', async () => {
		const { board, card } = await boardAndCard(ctx, 'mine', 'first');
		expect(board?.id).toBe(B1);
		expect(card).toMatchObject({ title: 'First', content_preview: 'Body' });
		expect(card?.uploads.map((u) => u.url)).toEqual(['https://x/a.png']);
		expect((await boardAndCard(ctx, 'mine', 'nope')).card).toBeNull();
	});

	it('follows a URL shortcut and counts the visit', async () => {
		expect(await followShortcut(ctx, 'gh')).toBe('https://github.com');
		expect(await followShortcut(ctx, 'none')).toBeNull();
		expect(one(`SELECT visit_count FROM url_shortcuts`).visit_count).toBe(1);
	});
});

describe('news and push', () => {
	it('posts news with a bell for every user and returns the subscriptions', async () => {
		const posted = await postNews(ctx, { title: 'Hi', body: 'There', url: null });
		expect(posted.recipients).toBe(2);
		expect(posted.subscriptions).toHaveLength(2);
		expect(
			one(`SELECT count(*) AS n FROM notifications WHERE related_news_id = '${posted.newsId}'`).n
		).toBe(2);
		expect(one(`SELECT created_by FROM news`).created_by).toBe('me');
	});

	it('prunes subscriptions the push service says are gone', async () => {
		sendNotification.mockImplementation(async (sub: { endpoint: string }) => {
			if (sub.endpoint.endsWith('dead'))
				throw Object.assign(new Error('gone'), { statusCode: 410 });
		});
		const subs = sqlite.prepare(`SELECT * FROM push_subscriptions`).all() as never[];
		await sendPushToAll(ctx, subs, { title: 't', body: 'b' });
		expect(sqlite.prepare(`SELECT id FROM push_subscriptions`).all()).toEqual([{ id: 'p1' }]);
	});
});
