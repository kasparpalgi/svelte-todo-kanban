/** @file src/routes/api/google-calendar/__tests__/calendar.d1.test.ts */
// Google Calendar on D1 (#265): the callback stores the token as a `google_calendar`
// secret; calendar-event reads it, refreshes it when expired, and creates the event.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';

vi.mock('$env/dynamic/private', () => ({
	env: { DATA_BACKEND: 'd1', AUTH_GOOGLE_ID: 'id', AUTH_GOOGLE_SECRET: 'secret' }
}));
vi.mock('$env/static/public', () => ({ PUBLIC_APP_ENV: 'production', PUBLIC_APP_URL: 'http://x' }));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
vi.mock('$lib/utils/crypto', () => ({
	encryptToken: (s: string) => `enc:${s}`,
	decryptToken: (s: string) => s.replace(/^enc:/, '')
}));
const googleFetch = vi.fn();
vi.mock('$lib/server/google', () => ({ googleFetch: (...a: unknown[]) => googleFetch(...a) }));

const callback = (await import('../callback/+server')).GET;
const event = (await import('../../calendar-event/+server')).POST;

let sqlite: DatabaseSync;
const platform = () => ({ env: { DB: sqliteD1(sqlite) } });
const secret = () =>
	JSON.parse(
		(
			sqlite.prepare("SELECT value FROM user_secrets WHERE name='google_calendar'").get() as {
				value: string;
			}
		).value
	);

beforeEach(() => {
	googleFetch.mockReset();
	sqlite = migratedSqlite();
	sqlite.exec(`INSERT INTO users (id, username, email) VALUES ('u1', 'u1', 'u1@example.com')`);
});
afterEach(() => vi.unstubAllGlobals());

describe('Google Calendar on D1', () => {
	it('callback saves the token and a new ToDzz calendar', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				Response.json({ access_token: 'at', refresh_token: 'rt', expires_in: 3600 })
			)
		);
		googleFetch.mockResolvedValue({ id: 'cal1' });
		await expect(
			callback({
				url: new URL('http://x/api/google-calendar/callback?code=c&state=u1'),
				platform: platform()
			} as never)
		).rejects.toMatchObject({ location: '/settings?connected=google-calendar' });
		expect(secret()).toMatchObject({
			encrypted: 'enc:at',
			refresh_token: 'enc:rt',
			calendar_id: 'cal1',
			email: 'u1@example.com'
		});
	});

	it('calendar-event refreshes an expired token, saves it, and creates the event', async () => {
		sqlite.exec(`INSERT INTO user_secrets (user_id, name, value) VALUES ('u1', 'google_calendar',
			'{"encrypted":"enc:old","refresh_token":"enc:rt","calendar_id":"cal1","expires_at":1}')`);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ access_token: 'new', expires_in: 3600 }))
		);
		googleFetch.mockResolvedValue({ id: 'ev1', htmlLink: 'https://g/ev1' });
		const res = await event({
			request: new Request('http://x/api/calendar-event', {
				method: 'POST',
				body: JSON.stringify({ title: 'T', dueDate: '2030-01-01', hasTime: false, userId: 'u1' })
			}),
			platform: platform()
		} as never);
		expect(await res.json()).toEqual({ success: true, eventId: 'ev1', eventLink: 'https://g/ev1' });
		expect(googleFetch).toHaveBeenCalledWith(
			'new',
			expect.stringContaining('/calendars/cal1/events'),
			expect.anything()
		);
		expect(secret()).toMatchObject({ encrypted: 'enc:new', calendar_id: 'cal1' });
	});

	it('calendar-event answers 401 when not connected', async () => {
		const res = await event({
			request: new Request('http://x/api/calendar-event', {
				method: 'POST',
				body: JSON.stringify({ title: 'T', dueDate: '2030-01-01', userId: 'u1' })
			}),
			platform: platform()
		} as never);
		expect(res.status).toBe(401);
	});
});
