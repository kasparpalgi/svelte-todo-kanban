/** @file src/lib/stores/logging.svelte.ts */
import { browser } from '$app/environment';
import { dev } from '$app/environment';
import type { LogEntry } from '$lib/types/common';
import { request } from '$lib/graphql/client';
import { CREATE_LOG } from '$lib/graphql/documents';
import { LOGGING_CONFIG } from '$lib/config/logging';

async function isUserAuthenticated(): Promise<boolean> {
	if (!browser) return false;

	try {
		const response = await fetch('/api/auth/token');
		return response.ok;
	} catch {
		return false;
	}
}

function createLoggingStore() {
	const state = $state({
		logs: [] as LogEntry[],
		maxLogs: LOGGING_CONFIG.maxInMemoryLogs,
		enabledLevels: new Set(['info', 'warn', 'error']) as Set<LogEntry['level']>,
		pendingLogs: [] as LogEntry[],
		flushTimeout: null as ReturnType<typeof setTimeout> | null,
		isFlushingInProgress: false,
		userId: null as string | null,
		sessionId: browser ? crypto.randomUUID() : null,
		// Performance monitoring
		performanceMetrics: {
			pageLoads: 0,
			errorCount: 0,
			warnCount: 0,
			avgResponseTime: 0,
			slowOperations: [] as { operation: string; duration: number; timestamp: Date }[],
			flushSuccessCount: 0,
			flushFailureCount: 0
		},
		// Log sampling configuration (for high-volume events)
		sampling: {
			enabled: LOGGING_CONFIG.sampling.enabled,
			sampleRate: LOGGING_CONFIG.sampling.defaultRate,
			componentRates: { ...LOGGING_CONFIG.sampling.componentRates } as Record<string, number>
		},
		// Rate limiting (prevent log flooding)
		rateLimiter: {} as Record<string, { count: number; resetTime: number }>
	});

	const BATCH_SIZE = LOGGING_CONFIG.batchSize;
	const BATCH_TIMEOUT = LOGGING_CONFIG.batchTimeout;
	const RATE_LIMIT_WINDOW = LOGGING_CONFIG.rateLimitWindow;
	const RATE_LIMIT_MAX = LOGGING_CONFIG.rateLimitMax;

	async function flushLogs() {
		if (!browser || state.pendingLogs.length === 0) return;
		if (state.isFlushingInProgress) return;

		const isAuthenticated = await isUserAuthenticated();
		if (!isAuthenticated) {
			console.debug('[LoggingStore] Skipping log flush - user not authenticated');
			state.pendingLogs = [];
			return;
		}

		state.isFlushingInProgress = true;

		try {
			const logsToFlush = [...state.pendingLogs];
			state.pendingLogs = [];

			if (state.flushTimeout) {
				clearTimeout(state.flushTimeout);
				state.flushTimeout = null;
			}

			const logsToSave = logsToFlush.filter((log) => log.level === 'error' || log.level === 'warn');

			if (logsToSave.length === 0) return;

			await Promise.all(
				logsToSave.map((log) => {
					const logInput = {
						timestamp: log.timestamp.toISOString(),
						level: log.level,
						component: log.component,
						message: log.message,
						data: log.data ? JSON.stringify(log.data) : null,
						session_id: state.sessionId,
						user_agent: log.userAgent,
						url: log.url
					};

					return request(CREATE_LOG, { log: logInput })
						.then(() => {
							state.performanceMetrics.flushSuccessCount++;
						})
						.catch((error) => {
							state.performanceMetrics.flushFailureCount++;

							if (dev) {
								console.error('[LoggingStore] Failed to save log to database', error);
							}

							const isAuthError =
								error?.name === 'AuthenticationError' ||
								error?.message === 'Authentication required';

							if (!dev && !isAuthError) {
								state.pendingLogs.push(log);
							}
						});
				})
			);
		} finally {
			state.isFlushingInProgress = false;
		}
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

	function shouldSample(component: string, level: LogEntry['level']): boolean {
		if (level === 'error' || level === 'warn') return true;

		if (dev || !state.sampling.enabled) return true;

		const componentRate = state.sampling.componentRates[component];
		const sampleRate = componentRate !== undefined ? componentRate : state.sampling.sampleRate;

		return Math.random() < sampleRate;
	}

	function checkRateLimit(component: string): boolean {
		const now = Date.now();
		const limiter = state.rateLimiter[component];

		if (!limiter || now > limiter.resetTime) {
			state.rateLimiter[component] = {
				count: 1,
				resetTime: now + RATE_LIMIT_WINDOW
			};
			return true;
		}

		if (limiter.count >= RATE_LIMIT_MAX) {
			// Rate limit exceeded
			if (limiter.count === RATE_LIMIT_MAX) {
				console.warn(`[LoggingStore] Rate limit exceeded for component: ${component}`);
			}
			limiter.count++;
			return false;
		}

		limiter.count++;
		return true;
	}

	function log(level: LogEntry['level'], component: string, message: string, data?: any) {
		if (!browser) return;

		if (!state.enabledLevels.has(level)) return;

		if (level !== 'error' && !checkRateLimit(component)) {
			return;
		}

		if (!shouldSample(component, level)) {
			return;
		}

		if (level === 'error') state.performanceMetrics.errorCount++;
		if (level === 'warn') state.performanceMetrics.warnCount++;

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

		state.logs.unshift(entry);

		if (state.logs.length > state.maxLogs) {
			state.logs.splice(state.maxLogs);
		}

		state.pendingLogs.push(entry);

		if (state.pendingLogs.length >= BATCH_SIZE) {
			flushLogs();
		} else {
			scheduleBatchFlush();
		}

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

		const seen = new WeakSet();

		function removeSensitive(obj: any, depth = 0): any {
			if (depth > 10) return '[Max Depth Reached]';
			if (obj === null) return null;
			if (obj === undefined) return undefined;
			if (typeof obj !== 'object') return obj;
			if (obj instanceof Date) return obj.toISOString();

			if (obj instanceof Error) {
				return {
					name: obj.name,
					message: obj.message,
					stack: obj.stack,
					cause: obj.cause ? removeSensitive(obj.cause, depth + 1) : undefined
				};
			}

			if (seen.has(obj)) return '[Circular]';
			seen.add(obj);

			if (Array.isArray(obj)) {
				return obj.map((item) => removeSensitive(item, depth + 1));
			}

			const result: any = {};
			for (const key in obj) {
				const value = obj[key];
				if (typeof value === 'function' || typeof value === 'symbol') continue;

				const lowerKey = key.toLowerCase();
				const isSensitive = sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()));

				if (isSensitive && (typeof value !== 'object' || value === null)) {
					result[key] = '[REDACTED]';
				} else {
					try {
						result[key] = removeSensitive(value, depth + 1);
					} catch (err) {
						result[key] = '[Serialization Error]';
					}
				}
			}

			return result;
		}

		try {
			return removeSensitive(data);
		} catch (err) {
			return { error: 'Failed to sanitize data', type: typeof data };
		}
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

	function trackPerformance(operation: string, duration: number) {
		if (!browser) return;

		// Slow
		if (duration > LOGGING_CONFIG.performance.slowOperationThreshold) {
			state.performanceMetrics.slowOperations.push({
				operation,
				duration,
				timestamp: new Date()
			});

			if (
				state.performanceMetrics.slowOperations.length >
				LOGGING_CONFIG.performance.maxSlowOperationsTracked
			) {
				state.performanceMetrics.slowOperations.shift();
			}

			warn('Performance', `Slow operation detected: ${operation}`, {
				duration: `${duration}ms`,
				threshold: `${LOGGING_CONFIG.performance.slowOperationThreshold}ms`
			});
		}
	}

	function measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		const start = performance.now();
		return fn()
			.then((result) => {
				const duration = performance.now() - start;
				trackPerformance(operation, duration);
				return result;
			})
			.catch((err) => {
				const duration = performance.now() - start;
				trackPerformance(operation, duration);
				throw err;
			});
	}

	function measureSync<T>(operation: string, fn: () => T): T {
		const start = performance.now();
		try {
			const result = fn();
			const duration = performance.now() - start;
			trackPerformance(operation, duration);
			return result;
		} catch (err) {
			const duration = performance.now() - start;
			trackPerformance(operation, duration);
			throw err;
		}
	}

	function setSampleRate(component: string, rate: number) {
		state.sampling.componentRates[component] = rate;
	}

	function enableSampling(enabled: boolean) {
		state.sampling.enabled = enabled;
	}

	function getPerformanceMetrics() {
		return { ...state.performanceMetrics };
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
		flushLogs,
		trackPerformance,
		measureAsync,
		measureSync,
		getPerformanceMetrics,
		setSampleRate,
		enableSampling
	};
}

export const loggingStore = createLoggingStore();
