/** @file src/lib/stores/claudeUsage.svelte.ts */
import { browser } from '$app/environment';
import { call } from '$lib/api/call';
import { currentMonthBounds } from '$lib/utils/claudeCost';

// Per-user calendar-month total API-list cost (claude_usage.cost_usd), used to
// amortize a flat Claude plan into an effective ratio (#21). The server answers only
// for the signed-in user, so this resolves to null for anyone else's id.
function createClaudeUsageStore() {
	const state = $state({
		monthCostByUser: {} as Record<string, number | null>,
		pending: new Set<string>()
	});

	async function loadMonthCost(userId: string): Promise<void> {
		if (!browser || !userId) return;
		if (userId in state.monthCostByUser || state.pending.has(userId)) return;

		state.pending.add(userId);
		try {
			const { from, to } = currentMonthBounds();
			state.monthCostByUser[userId] = await call('getClaudeUsageCost', { userId, from, to });
		} catch (error) {
			console.error('[ClaudeUsageStore] Failed to load month cost:', error);
			state.monthCostByUser[userId] = null;
		} finally {
			state.pending.delete(userId);
		}
	}

	function monthCost(userId: string): number | null {
		return state.monthCostByUser[userId] ?? null;
	}

	return {
		loadMonthCost,
		monthCost
	};
}

export const claudeUsageStore = createClaudeUsageStore();
