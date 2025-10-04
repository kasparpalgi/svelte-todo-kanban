/** @file src/lib/stores/logging.svelte.ts */
import { browser } from '$app/environment';
import { dev } from '$app/environment';
import type { LogEntry } from '$lib/types/common';
import { request } from '$lib/graphql/client';
import { CREATE_LOG } from '$lib/graphql/documents';

function createLoggingStore() {
	const state = $state({
		logs: [] as LogEntry[],
		maxLogs: 1000,
		enabledLevels: new Set(['info', 'warn', 'error']) as Set<LogEntry['level']>,
		pendingLogs: [] as LogEntry[],
		flushTimeout: null as ReturnType<typeof setTimeout> | null,
		userId: null as string | null,
		sessionId: browser ? crypto.randomUUID() : null
	});

	const BATCH_SIZE = 50;
	const BATCH_TIMEOUT = 10000; // 10 seconds

	async function flushLogs() {
		if (!browser || state.pendingLogs.length === 0) return;

		const logsToFlush = [...state.pendingLogs];
		state.pendingLogs = [];

		if (state.flushTimeout) {
			clearTimeout(state.flushTimeout);
			state.flushTimeout = null;
		}

		// Only persist ERROR and WARN levels to database
		const logsToSave = logsToFlush.filter((log) => log.level === 'error' || log.level === 'warn');

		if (logsToSave.length === 0) return;

		// Send logs to database asynchronously (fire and forget)
		Promise.all(
			logsToSave.map((log) => {
				const logInput = {
					timestamp: log.timestamp.toISOString(),
					level: log.level,
					component: log.component,
					message: log.message,
					data: log.data ? JSON.stringify(log.data) : null,
					user_id: state.userId,
					session_id: state.sessionId,
					user_agent: log.userAgent,
					url: log.url
				};

				return request(CREATE_LOG, { log: logInput }).catch((error) => {
					// Silent failure - don't break app if logging fails
					if (dev) {
						console.error('[LoggingStore] Failed to save log to database', error);
					}
				});
			})
		).catch(() => {
			// Ignore batch failures
		});
	}

	function scheduleBatchFlush() {
		if (!browser) return;

		if (state.flushTimeout) {
			clearTimeout(state.flushTimeout);
		}

		state.flushTimeout = setTimeout(() => {
			flushLogs();
		}, BATCH_TIMEOUT);
	}

	function log(level: LogEntry['level'], component: string, message: string, data?: any) {
		if (!browser) return;

		if (!state.enabledLevels.has(level)) return;

		// Sanitize data - remove sensitive fields
		const sanitizedData = sanitizeData(data);

		const entry: LogEntry = {
			id: crypto.randomUUID(),
			timestamp: new Date(),
			level,
			component,
			message,
			data: sanitizedData,
			userAgent: navigator.userAgent,
			url: window.location.href
		};

		// Add to in-memory logs
		state.logs.unshift(entry);

		if (state.logs.length > state.maxLogs) {
			state.logs.splice(state.maxLogs);
		}

		// Add to pending batch for database persistence
		state.pendingLogs.push(entry);

		// Flush immediately if batch size reached, otherwise schedule
		if (state.pendingLogs.length >= BATCH_SIZE) {
			flushLogs();
		} else {
			scheduleBatchFlush();
		}

		// Console output in development or for errors/warnings
		if (dev || level === 'error' || level === 'warn') {
			const consoleMessage = `[${component}] ${message}`;
			switch (level) {
				case 'debug':
					console.debug(consoleMessage, sanitizedData);
					break;
				case 'info':
					console.info(consoleMessage, sanitizedData);
					break;
				case 'warn':
					console.warn(consoleMessage, sanitizedData);
					break;
				case 'error':
					console.error(consoleMessage, sanitizedData);
					break;
			}
		}
	}

	function sanitizeData(data: any): any {
		if (!data) return undefined;

		// Clone the data to avoid mutating the original
		const cloned = JSON.parse(JSON.stringify(data));

		// Remove sensitive fields
		const sensitiveFields = [
			'password',
			'token',
			'apikey',
			'secret',
			'auth',
			'authorization',
			'cookie',
			'session',
			'creditcard',
			'ssn',
			'encrypted'
		];

		function removeSensitive(obj: any): any {
			if (typeof obj !== 'object' || obj === null) return obj;

			if (Array.isArray(obj)) {
				return obj.map(removeSensitive);
			}

			const result: any = {};
			for (const key in obj) {
				const lowerKey = key.toLowerCase();
				const isSensitive = sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()));
				const value = obj[key];

				// If key is sensitive and value is an object, still recurse into it
				// Otherwise redact primitive sensitive values
				if (isSensitive && (typeof value !== 'object' || value === null)) {
					result[key] = '[REDACTED]';
				} else {
					result[key] = removeSensitive(value);
				}
			}
			return result;
		}

		return removeSensitive(cloned);
	}

	function setUserId(userId: string | null) {
		state.userId = userId;
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
			sessionId: state.sessionId,
			userId: state.userId,
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
		setLogLevel,
		setUserId,
		flushLogs
	};
}

export const loggingStore = createLoggingStore();
