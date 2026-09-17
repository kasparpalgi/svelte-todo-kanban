/** @file src/lib/stores/claudeUsage.svelte.ts */
import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { GET_CLAUDE_USAGE_MONTH } from '$lib/graphql/documents';
import { currentMonthBounds } from '$lib/utils/claudeCost';
import type { GetClaudeUsageMonthQuery } from '$lib/graphql/generated/graphql';

// Per-user calendar-month total API-list cost (claude_usage.cost_usd), used to
// amortize a flat Claude plan into an effective ratio (#21). RLS only returns
// rows for the signed-in user, so this resolves to null for anyone else's id.
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
			const data: GetClaudeUsageMonthQuery = await request(GET_CLAUDE_USAGE_MONTH, {
				user_id: userId,
				from,
				to
			});
			state.monthCostByUser[userId] = data.claude_usage_aggregate?.aggregate?.sum?.cost_usd ?? null;
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
