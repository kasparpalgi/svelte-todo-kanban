/** @file src/routes/api/billing/checkout/+server.ts
 * Creates a Stripe Checkout Session for the 12€/year paid plan (#194).
 * Talks to the Stripe REST API directly (no SDK). Never creates products or
 * prices — it references STRIPE_PRICE_ID that must be configured in Stripe.
 * The webhook (billing/webhook) is what actually flips the user to paid.
 */
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getPlanContext } from '$lib/server/plan';
import { serverRequest } from '$lib/graphql/server-client';
import type { RequestHandler } from './$types';

/** Strip stray quotes/whitespace (local .env is CRLF; keys can carry junk). */
function cleanKey(v: string | undefined): string {
	return (v ?? '').trim().replace(/^["']|["']$/g, '');
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const session = await locals.auth();
	const userId = session?.user?.id;
	const email = session?.user?.email ?? undefined;
	if (!userId) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const stripeKey = cleanKey(env.STRIPE_API_KEY);
	const priceId = cleanKey(env.STRIPE_PRICE_ID);
	if (!stripeKey || !priceId) {
		return json(
			{ error: 'Billing is not configured yet. Please try again later.' },
			{ status: 503 }
		);
	}

	let lang = 'en';
	try {
		const body = await request.json();
		if (body?.lang && typeof body.lang === 'string') lang = body.lang;
	} catch {
		// no body is fine
	}

	const ctx = await getPlanContext(userId);
	if (ctx?.isPaid) {
		return json({ error: 'You are already on the paid plan.' }, { status: 400 });
	}

	const base = url.origin;
	const params = new URLSearchParams();
	params.set('mode', 'subscription');
	params.set('line_items[0][price]', priceId);
	params.set('line_items[0][quantity]', '1');
	params.set('success_url', `${base}/${lang}/settings?upgrade=success`);
	params.set('cancel_url', `${base}/${lang}/settings?upgrade=cancel`);
	params.set('client_reference_id', userId);
	params.set('metadata[userId]', userId);
	params.set('subscription_data[metadata][userId]', userId);
	params.set('allow_promotion_codes', 'true');
	if (ctx?.stripeCustomerId) {
		params.set('customer', ctx.stripeCustomerId);
	} else if (email) {
		params.set('customer_email', email);
	}

	try {
		const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${stripeKey}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});

		const data = await resp.json();
		if (!resp.ok) {
			console.error('Stripe checkout error:', data?.error?.message || data);
			return json({ error: data?.error?.message || 'Failed to start checkout' }, { status: 502 });
		}

		// Persist the customer id early so the webhook can reconcile by customer too.
		if (data.customer && !ctx?.stripeCustomerId) {
			try {
				await serverRequest<unknown, { userId: string; cid: string }>(
					`mutation SaveStripeCustomer($userId: uuid!, $cid: String!) {
						update_users_by_pk(pk_columns: { id: $userId }, _set: { stripe_customer_id: $cid }) { id }
					}`,
					{ userId, cid: data.customer }
				);
			} catch (e) {
				console.error('Failed to persist stripe_customer_id:', e);
			}
		}

		return json({ url: data.url });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Checkout failed';
		console.error('Checkout exception:', error);
		return json({ error: message }, { status: 500 });
	}
};
