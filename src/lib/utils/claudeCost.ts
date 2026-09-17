/** @file src/lib/utils/claudeCost.ts */

const PLANS_WITH_SUBSCRIPTION = ['pro', 'max5x', 'max20x'];

// Calendar month in UTC, matching how claude_usage.created_at is stored.
export function currentMonthBounds(): { from: string; to: string } {
	const now = new Date();
	const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
	const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
	return { from: from.toISOString(), to: to.toISOString() };
}

// M / L from #21: a flat-plan subscription (M) amortized over the period's
// total API-list cost (L). null when it can't be computed yet (no usage this period).
export function effectiveRatio(
	plan: string | null | undefined,
	monthly: number | null | undefined,
	periodListCostUsd: number | null | undefined
): number | null {
	if (!plan || !PLANS_WITH_SUBSCRIPTION.includes(plan)) return 1;
	if (!monthly || monthly <= 0) return null;
	if (!periodListCostUsd || periodListCostUsd <= 0) return null;
	return monthly / periodListCostUsd;
}

export function formatUsd(amount: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatPlanCurrency(amount: number, currency: string | null | undefined): string {
	return new Intl.NumberFormat('en-EU', {
		style: 'currency',
		currency: currency || 'EUR'
	}).format(amount);
}
