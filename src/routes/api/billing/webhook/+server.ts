/** @file src/routes/api/billing/webhook/+server.ts
 * Stripe webhook (#194) — the only writer that flips a user to/from paid.
 * Verifies the signature with STRIPE_WEBHOOK_SECRET (HMAC-SHA256 over
 * `${timestamp}.${rawBody}`), then updates the plan via the admin secret.
 * Configure the endpoint in Stripe pointing at /api/billing/webhook.
 */
import { env } from '$env/dynamic/private';
import { json, text } from '@sveltejs/kit';
import crypto from 'crypto';
import { serverRequest } from '$lib/graphql/server-client';
import type { RequestHandler } from './$types';

function cleanKey(v: string | undefined): string {
	return (v ?? '').trim().replace(/^["']|["']$/g, '');
}

/** Verify Stripe's `Stripe-Signature` header against the raw payload. */
function verifySignature(payload: string, header: string | null, secret: string): boolean {
	if (!header) return false;
	const parts = Object.fromEntries(
		header.split(',').map((kv) => {
			const [k, ...rest] = kv.split('=');
			return [k.trim(), rest.join('=')];
		})
	);
	const timestamp = parts['t'];
	const signature = parts['v1'];
	if (!timestamp || !signature) return false;

	const expected = crypto
		.createHmac('sha256', secret)
		.update(`${timestamp}.${payload}`, 'utf8')
		.digest('hex');

	try {
		const a = Buffer.from(expected, 'hex');
		const b = Buffer.from(signature, 'hex');
		return a.length === b.length && crypto.timingSafeEqual(a, b);
	} catch {
		return false;
	}
}

type PlanSet = {
	plan: 'free' | 'paid';
	plan_expires_at: string | null;
	stripe_customer_id?: string | null;
};

async function setPlanByUserId(userId: string, set: PlanSet) {
	await serverRequest<unknown, { userId: string; set: PlanSet }>(
		`mutation SetPlanById($userId: uuid!, $set: users_set_input!) {
			update_users_by_pk(pk_columns: { id: $userId }, _set: $set) { id }
		}`,
		{ userId, set }
	);
}

async function setPlanByCustomer(customerId: string, set: PlanSet) {
	await serverRequest<{ update_users: { affected_rows: number } }, { cid: string; set: PlanSet }>(
		`mutation SetPlanByCustomer($cid: String!, $set: users_set_input!) {
			update_users(where: { stripe_customer_id: { _eq: $cid } }, _set: $set) { affected_rows }
		}`,
		{ cid: customerId, set }
	);
}

/** Apply a plan update from an event, preferring userId, falling back to customer. */
async function applyPlan(
	userId: string | undefined,
	customerId: string | null | undefined,
	set: PlanSet
) {
	if (userId) {
		await setPlanByUserId(userId, set);
	} else if (customerId) {
		await setPlanByCustomer(customerId, set);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const secret = cleanKey(env.STRIPE_WEBHOOK_SECRET);
	if (!secret) {
		return json({ error: 'Webhook not configured' }, { status: 503 });
	}

	const payload = await request.text();
	const sig = request.headers.get('stripe-signature');

	if (!verifySignature(payload, sig, secret)) {
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	let event: any;
	try {
		event = JSON.parse(payload);
	} catch {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	try {
		const obj = event.data?.object ?? {};
		const customerId: string | null = obj.customer ?? null;

		switch (event.type) {
			case 'checkout.session.completed': {
				const userId = obj.metadata?.userId || obj.client_reference_id || undefined;
				// One year of access from purchase; subscription.* events refine the exact date.
				const expires = new Date();
				expires.setFullYear(expires.getFullYear() + 1);
				await applyPlan(userId, customerId, {
					plan: 'paid',
					plan_expires_at: expires.toISOString(),
					...(customerId ? { stripe_customer_id: customerId } : {})
				});
				break;
			}
			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const userId = obj.metadata?.userId || undefined;
				const status: string = obj.status;
				const active = status === 'active' || status === 'trialing' || status === 'past_due';
				const periodEnd: number | undefined = obj.current_period_end;
				await applyPlan(userId, customerId, {
					plan: active ? 'paid' : 'free',
					plan_expires_at: active && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
					...(customerId ? { stripe_customer_id: customerId } : {})
				});
				break;
			}
			case 'customer.subscription.deleted': {
				const userId = obj.metadata?.userId || undefined;
				await applyPlan(userId, customerId, { plan: 'free', plan_expires_at: null });
				break;
			}
			default:
				// Unhandled event types are acknowledged so Stripe stops retrying.
				break;
		}
	} catch (error) {
		console.error('Webhook handling error:', error);
		return json({ error: 'Handler error' }, { status: 500 });
	}

	return text('ok');
};
