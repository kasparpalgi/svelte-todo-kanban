import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { GET_ACTIVITY_LOGS, CREATE_ACTIVITY_LOG } from '$lib/graphql/documents';
import type {
	GetActivityLogsQuery,
	CreateActivityLogMutation,
	Activity_Logs_Insert_Input
} from '$lib/graphql/generated/graphql';

export interface ActivityLogState {
	logs: Array<any>;
	loading: boolean;
	error: string | null;
}

function createActivityLogStore() {
	const state = $state<ActivityLogState>({
		logs: [],
		loading: false,
		error: null
	});

	async function loadActivityLogs(todoId: string, limit = 100, offset = 0) {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.loading = true;
		state.error = null;
		try {
			const data = (await request(GET_ACTIVITY_LOGS, {
				where: { todo_id: { _eq: todoId } },
				order_by: [{ created_at: 'desc' }],
				limit,
				offset
			})) as GetActivityLogsQuery;

			state.logs = data.activity_logs || [];
			console.log('[ActivityLogStore.loadActivityLogs]', { todoId, count: state.logs.length });
			return { success: true, message: 'Activity logs loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			console.log('[ActivityLogStore.loadActivityLogs] Error:', state.error);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	async function loadBoardActivityLogs(boardId: string, limit = 100, offset = 0) {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.loading = true;
		state.error = null;
		try {
			const data = (await request(GET_ACTIVITY_LOGS, {
				where: {
					todo: {
						list: {
							board_id: { _eq: boardId }
						}
					}
				},
				order_by: [{ created_at: 'desc' }],
				limit,
				offset
			})) as GetActivityLogsQuery;

			state.logs = data.activity_logs || [];
			console.log('[ActivityLogStore.loadBoardActivityLogs]', {
				boardId,
				count: state.logs.length
			});
			return { success: true, message: 'Board activity logs loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			console.log('[ActivityLogStore.loadBoardActivityLogs] Error:', state.error);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	async function createActivityLog(log: Activity_Logs_Insert_Input) {
		if (!browser) return { success: false, message: 'Not in browser', data: null };

		try {
			const data = (await request(CREATE_ACTIVITY_LOG, {
				log
			})) as CreateActivityLogMutation;

			const newLog = data.insert_activity_logs_one;
			if (newLog) {
				state.logs.unshift(newLog);
				console.log('[ActivityLogStore.createActivityLog]', {
					id: newLog.id,
					action: newLog.action_type
				});
				return { success: true, message: 'Activity logged', data: newLog };
			}
			return { success: false, message: 'Failed to create activity log' };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.log('[ActivityLogStore.createActivityLog] Error:', message);
			return { success: false, message };
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
		loadActivityLogs,
		loadBoardActivityLogs,
		createActivityLog
	};
}

export const activityLogStore = createActivityLogStore();
