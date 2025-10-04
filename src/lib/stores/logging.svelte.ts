/** @file src/lib/stores/logging.svelte.ts */
import { browser } from '$app/environment';
import { dev } from '$app/environment';
import type { LogEntry } from '$lib/types/common';
import { request } from '$lib/graphql/client';
import { CREATE_LOG } from '$lib/graphql/documents';
import { LOGGING_CONFIG } from '$lib/config/logging';

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

		// Prevent concurrent flushes
		if (state.isFlushingInProgress) return;

		state.isFlushingInProgress = true;

		try {
			const logsToFlush = [...state.pendingLogs];
			state.pendingLogs = [];

			if (state.flushTimeout) {
				clearTimeout(state.flushTimeout);
				state.flushTimeout = null;
			}

			// Only persist ERROR and WARN levels to database
			const logsToSave = logsToFlush.filter((log) => log.level === 'error' || log.level === 'warn');

			if (logsToSave.length === 0) return;

			// Send logs to database
			await Promise.all(
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

					return request(CREATE_LOG, { log: logInput })
						.then(() => {
							state.performanceMetrics.flushSuccessCount++;
						})
						.catch((error) => {
							state.performanceMetrics.flushFailureCount++;

							// In development, log to console
							if (dev) {
								console.error('[LoggingStore] Failed to save log to database', error);
							}

							// In production, re-queue the log for retry
							if (!dev) {
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
		// Always log errors and warnings
		if (level === 'error' || level === 'warn') return true;

		// Never sample in development
		if (dev || !state.sampling.enabled) return true;

		// Check component-specific sample rate
		const componentRate = state.sampling.componentRates[component];
		const sampleRate = componentRate !== undefined ? componentRate : state.sampling.sampleRate;

		return Math.random() < sampleRate;
	}

	function checkRateLimit(component: string): boolean {
		const now = Date.now();
		const limiter = state.rateLimiter[component];

		if (!limiter || now > limiter.resetTime) {
			// Reset or create new rate limiter
			state.rateLimiter[component] = {
				count: 1,
				resetTime: now + RATE_LIMIT_WINDOW
			};
			return true;
		}

		if (limiter.count >= RATE_LIMIT_MAX) {
			// Rate limit exceeded
			if (limiter.count === RATE_LIMIT_MAX) {
				// Log once that we're rate limiting
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

		// Check rate limiting (except for errors)
		if (level !== 'error' && !checkRateLimit(component)) {
			return;
		}

		// Apply sampling for high-volume logs
		if (!shouldSample(component, level)) {
			return;
		}

		// Update performance metrics
		if (level === 'error') state.performanceMetrics.errorCount++;
		if (level === 'warn') state.performanceMetrics.warnCount++;

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

		// Track seen objects to handle circular references
		const seen = new WeakSet();

		function removeSensitive(obj: any, depth = 0): any {
			// Prevent infinite recursion
			if (depth > 10) return '[Max Depth Reached]';

			// Handle primitives
			if (obj === null) return null;
			if (obj === undefined) return undefined;
			if (typeof obj !== 'object') return obj;

			// Handle Date objects
			if (obj instanceof Date) return obj.toISOString();

			// Handle Error objects specially (they have circular references)
			if (obj instanceof Error) {
				return {
					name: obj.name,
					message: obj.message,
					stack: obj.stack,
					cause: obj.cause ? removeSensitive(obj.cause, depth + 1) : undefined
				};
			}

			// Check for circular references
			if (seen.has(obj)) return '[Circular]';
			seen.add(obj);

			// Handle Arrays
			if (Array.isArray(obj)) {
				return obj.map((item) => removeSensitive(item, depth + 1));
			}

			// Handle Objects
			const result: any = {};
			for (const key in obj) {
				// Skip functions and symbols
				const value = obj[key];
				if (typeof value === 'function' || typeof value === 'symbol') continue;

				const lowerKey = key.toLowerCase();
				const isSensitive = sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()));

				// If key is sensitive and value is primitive, redact it
				if (isSensitive && (typeof value !== 'object' || value === null)) {
					result[key] = '[REDACTED]';
				} else {
					try {
						result[key] = removeSensitive(value, depth + 1);
					} catch (err) {
						// If serialization fails, use safe fallback
						result[key] = '[Serialization Error]';
					}
				}
			}

			return result;
		}

		try {
			return removeSensitive(data);
		} catch (err) {
			// Last resort fallback
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

	// Performance monitoring functions
	function trackPerformance(operation: string, duration: number) {
		if (!browser) return;

		// Track slow operations (configurable threshold)
		if (duration > LOGGING_CONFIG.performance.slowOperationThreshold) {
			state.performanceMetrics.slowOperations.push({
				operation,
				duration,
				timestamp: new Date()
			});

			// Keep only configured number of slow operations
			if (
				state.performanceMetrics.slowOperations.length >
				LOGGING_CONFIG.performance.maxSlowOperationsTracked
			) {
				state.performanceMetrics.slowOperations.shift();
			}

			// Log slow operations
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
		// Performance monitoring
		trackPerformance,
		measureAsync,
		measureSync,
		getPerformanceMetrics,
		// Sampling configuration
		setSampleRate,
		enableSampling
	};
}

export const loggingStore = createLoggingStore();
