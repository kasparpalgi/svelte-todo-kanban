/** @file src/lib/server/plan.ts
 * Server-side plan lookup (#194). Reads the authoritative plan + encrypted BYO
 * keys straight from the DB with the admin secret, so a client cannot spoof it.
 */
import { eq } from 'drizzle-orm';
import { serverRequest } from '$lib/graphql/server-client';
import { isPaid, type PlanUser } from '$lib/config/plan';
import { users } from '$lib/server/db/schema';
import type { Ctx } from '$lib/server/ops/op';
import { secretsOf } from '$lib/server/secrets';

export interface PlanContext {
	userId: string;
	plan: 'free' | 'paid';
	isPaid: boolean;
	planExpiresAt: string | null;
	stripeCustomerId: string | null;
	/** Raw settings JSON with the encrypted `tokens.*` (on D1, merged in from `user_secrets`). */
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

type PlanRow = NonNullable<UserPlanRow['users_by_pk']>;

async function planRowD1(d1: NonNullable<Ctx['d1']>, userId: string): Promise<PlanRow | null> {
	const [[row], secrets] = await Promise.all([
		d1
			.select({
				id: users.id,
				plan: users.plan,
				plan_expires_at: users.plan_expires_at,
				stripe_customer_id: users.stripe_customer_id,
				settings: users.settings
			})
			.from(users)
			.where(eq(users.id, userId)),
		secretsOf(d1, userId)
	]);
	if (!row) return null;
	const tokens = { ...(row.settings.tokens as object | undefined), ...secrets };
	return { ...row, settings: { ...row.settings, tokens } };
}

async function planRow(ctx: Ctx, userId: string): Promise<PlanRow | null> {
	if (ctx.d1) return planRowD1(ctx.d1, userId);
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
	return data.users_by_pk;
}

/** Load the plan context for a user, or null when the user does not exist. */
export async function getPlanContext(ctx: Ctx, userId: string): Promise<PlanContext | null> {
	const row = await planRow(ctx, userId);
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
