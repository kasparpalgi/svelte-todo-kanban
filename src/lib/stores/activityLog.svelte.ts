/** @file src/lib/stores/activityLog.svelte.ts */
// The board's activity feed. Rows are written by the server inside the op that caused
// them (#229), so this store only reads.
import { browser } from '$app/environment';
import { call, type OpOutput } from '$lib/api/call';

interface ActivityLogState {
	logs: OpOutput<'getBoardActivity'>;
	loading: boolean;
	error: string | null;
}

function createActivityLogStore() {
	const state = $state<ActivityLogState>({
		logs: [],
		loading: false,
		error: null
	});

	async function loadBoardActivityLogs(boardId: string, limit = 100, offset = 0) {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.loading = true;
		state.error = null;
		try {
			state.logs = await call('getBoardActivity', { boardId, limit, offset });
			return { success: true, message: 'Board activity logs loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	return {
		get logs() {
			return state.logs;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		loadBoardActivityLogs
	};
}

export const activityLogStore = createActivityLogStore();
