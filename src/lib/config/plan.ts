/** @file src/lib/config/plan.ts
 * Single source of truth for the free/paid plan model (#194).
 * Shared by client stores (soft upsell) and server endpoints (authoritative gating).
 */

export type PlanTier = 'free' | 'paid';

/** Limits that apply to the FREE plan. Paid removes all of them. */
export const FREE_LIMITS = {
	/** Max boards a user may own/belong-create. */
	boards: 7,
	/** Max uncompleted cards in a single board. */
	uncompletedCardsPerBoard: 40,
	/** Max collaborators per board (members + pending invitations, excluding owner). */
	collaboratorsPerBoard: 4,
	/** Max uploads total per user, unless they supply their own R2 credentials. */
	uploads: 10
} as const;

/** Reasons a limit dialog / upsell can be triggered. */
export type UpgradeReason = 'boards' | 'cards' | 'collaborators' | 'uploads' | 'ai';

/** Yearly price, in euros, charged via Stripe. */
export const PAID_PRICE_EUR = 12;

/** Minimal shape needed to evaluate plan status (matches the users row). */
export interface PlanUser {
	plan?: string | null;
	plan_expires_at?: string | null;
}

/**
 * True when the user is on an active paid plan. A paid plan with a past
 * `plan_expires_at` is treated as lapsed (back to free) so an unrenewed
 * subscription stops granting paid features even before the webhook flips it.
 */
export function isPaid(user: PlanUser | null | undefined): boolean {
	if (!user || user.plan !== 'paid') return false;
	if (!user.plan_expires_at) return true;
	return new Date(user.plan_expires_at).getTime() > Date.now();
}
