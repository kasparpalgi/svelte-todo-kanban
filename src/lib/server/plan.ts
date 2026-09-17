/** @file src/lib/server/plan.ts
 * Server-side plan lookup (#194). Reads the authoritative plan + encrypted BYO
 * keys straight from the DB with the admin secret, so a client cannot spoof it.
 */
import { serverRequest } from '$lib/graphql/server-client';
import { isPaid, type PlanUser } from '$lib/config/plan';

export interface PlanContext {
	userId: string;
	plan: 'free' | 'paid';
	isPaid: boolean;
	planExpiresAt: string | null;
	stripeCustomerId: string | null;
	/** Raw settings JSON (contains the encrypted `tokens.*`). */
	settings: Record<string, any> | null;
}

interface UserPlanRow {
	users_by_pk: {
		id: string;
		plan: string | null;
		plan_expires_at: string | null;
		stripe_customer_id: string | null;
		settings: Record<string, any> | null;
	} | null;
}

/** Load the plan context for a user, or null when the user does not exist. */
export async function getPlanContext(userId: string): Promise<PlanContext | null> {
	const data = await serverRequest<UserPlanRow, { userId: string }>(
		`query GetUserPlan($userId: uuid!) {
			users_by_pk(id: $userId) {
				id
				plan
				plan_expires_at
				stripe_customer_id
				settings
			}
		}`,
		{ userId }
	);

	const row = data.users_by_pk;
	if (!row) return null;

	const planUser: PlanUser = { plan: row.plan, plan_expires_at: row.plan_expires_at };
	return {
		userId: row.id,
		plan: row.plan === 'paid' ? 'paid' : 'free',
		isPaid: isPaid(planUser),
		planExpiresAt: row.plan_expires_at,
		stripeCustomerId: row.stripe_customer_id ?? null,
		settings: row.settings ?? null
	};
}
