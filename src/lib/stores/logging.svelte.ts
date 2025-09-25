/** @file src/lib/stores/logging.svelte.ts */
import { browser } from '$app/environment';
import type { LogEntry } from '$lib/types/common';

function createLoggingStore() {
	const state = $state({
		logs: [] as LogEntry[],
		maxLogs: 1000,
		enabledLevels: new Set(['info', 'warn', 'error']) as Set<LogEntry['level']>
	});

	function log(level: LogEntry['level'], component: string, message: string, data?: any) {
		if (!browser) return;

		if (!state.enabledLevels.has(level)) return;

		const entry: LogEntry = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			level,
			component,
			message,
			data: data ? JSON.parse(JSON.stringify(data)) : undefined,
			userAgent: navigator.userAgent,
			url: window.location.href
		};

		state.logs.unshift(entry);

		if (state.logs.length > state.maxLogs) {
			state.logs.splice(state.maxLogs);
		}

		// TODO: only in "dev" env
		if (level === 'error' || level === 'warn') {
			const consoleMessage = `[${component}] ${message}`;
			switch (level) {
				case 'warn':
					console.warn(consoleMessage, data);
					break;
				case 'error':
					console.error(consoleMessage, data);
					break;
			}
		}
	}

	function debug(component: string, message: string, data?: any) {
		log('debug', component, message, data);
	}

	function info(component: string, message: string, data?: any) {
		log('info', component, message, data);
	}

	function warn(component: string, message: string, data?: any) {
		log('warn', component, message, data);
	}

	function error(component: string, message: string, data?: any) {
		log('error', component, message, data);
	}

	function clear() {
		state.logs = [];
	}

	function exportLogs() {
		if (!browser) return '';

		const logsData = {
			exportTime: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href,
			logs: state.logs
		};

		return JSON.stringify(logsData, null, 2);
	}

	function setLogLevel(levels: LogEntry['level'][]) {
		state.enabledLevels = new Set(levels);
	}

	const recentErrors = $derived(state.logs.filter((log) => log.level === 'error').slice(0, 10));

	const recentWarnings = $derived(state.logs.filter((log) => log.level === 'warn').slice(0, 10));

	const logsByComponent = $derived(
		state.logs.reduce(
			(acc, log) => {
				if (!acc[log.component]) acc[log.component] = [];
				acc[log.component].push(log);
				return acc;
			},
			{} as Record<string, LogEntry[]>
		)
	);

	return {
		get logs() {
			return state.logs;
		},
		get recentErrors() {
			return recentErrors;
		},
		get recentWarnings() {
			return recentWarnings;
		},
		get logsByComponent() {
			return logsByComponent;
		},
		debug,
		info,
		warn,
		error,
		clear,
		exportLogs,
		setLogLevel
	};
}

export const loggingStore = createLoggingStore();
