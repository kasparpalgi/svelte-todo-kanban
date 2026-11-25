/** @file src/routes/api/billing/__tests__/billing.d1.test.ts */
// Stripe checkout + webhook on D1 (#265). The webhook gets a really signed event.
import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';

vi.mock('$env/dynamic/private', () => ({
	env: {
		DATA_BACKEND: 'd1',
		STRIPE_WEBHOOK_SECRET: 'whsec_test',
		STRIPE_API_KEY: 'sk_test',
		STRIPE_PRICE_ID: 'price_1'
	}
}));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));

const webhook = (await import('../webhook/+server')).POST;
const checkout = (await import('../checkout/+server')).POST;

let sqlite: DatabaseSync;
const platform = () => ({ env: { DB: sqliteD1(sqlite) } });
const row = () =>
	sqlite
		.prepare("SELECT plan, plan_expires_at, stripe_customer_id FROM users WHERE id='u1'")
		.get() as {
		plan: string;
		plan_expires_at: string | null;
		stripe_customer_id: string | null;
	};

beforeEach(() => {
	sqlite = migratedSqlite();
	sqlite.exec(`INSERT INTO users (id, username, email) VALUES ('u1', 'u1', 'u1@example.com')`);
});
afterEach(() => vi.unstubAllGlobals());

function send(event: object, secret = 'whsec_test') {
	const payload = JSON.stringify(event);
	const t = '1700000000';
	const v1 = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
	return webhook({
		request: new Request('http://x/api/billing/webhook', {
			method: 'POST',
			body: payload,
			headers: { 'stripe-signature': `t=${t},v1=${v1}` }
		}),
		platform: platform()
	} as never);
}

describe('POST /api/billing/webhook on D1', () => {
	it('rejects a bad signature', async () => {
		expect((await send({ type: 'x' }, 'wrong')).status).toBe(400);
	});

	it('checkout.session.completed makes the user paid and stores the customer', async () => {
		const res = await send({
			type: 'checkout.session.completed',
			data: { object: { customer: 'cus_1', metadata: { userId: 'u1' } } }
		});
		expect(res.status).toBe(200);
		expect(row()).toMatchObject({ plan: 'paid', stripe_customer_id: 'cus_1' });
		expect(row().plan_expires_at).toBeTruthy();
	});

	it('finds the user by customer id when the event has no userId, and downgrades on delete', async () => {
		sqlite.exec("UPDATE users SET plan='paid', stripe_customer_id='cus_2' WHERE id='u1'");
		await send({ type: 'customer.subscription.deleted', data: { object: { customer: 'cus_2' } } });
		expect(row()).toMatchObject({ plan: 'free', plan_expires_at: null });
	});

	it('subscription.updated sets the period end', async () => {
		await send({
			type: 'customer.subscription.updated',
			data: {
				object: {
					customer: 'cus_3',
					status: 'active',
					current_period_end: 1893456000,
					metadata: { userId: 'u1' }
				}
			}
		});
		expect(row()).toMatchObject({ plan: 'paid', plan_expires_at: '2030-01-01T00:00:00.000Z' });
	});
});

describe('POST /api/billing/checkout on D1', () => {
	it('saves the Stripe customer id on the user', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => Response.json({ url: 'https://stripe/pay', customer: 'cus_9' }))
		);
		const res = await checkout({
			request: new Request('http://x/api/billing/checkout', { method: 'POST', body: '{}' }),
			locals: { auth: async () => ({ user: { id: 'u1', email: 'u1@example.com' } }) },
			url: new URL('http://x/'),
			platform: platform()
		} as never);
		expect(await res.json()).toEqual({ url: 'https://stripe/pay' });
		expect(row().stripe_customer_id).toBe('cus_9');
	});
});
