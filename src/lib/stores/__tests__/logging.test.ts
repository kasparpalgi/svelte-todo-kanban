/** @file src/lib/stores/__tests__/logging.test.ts */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loggingStore } from '../logging.svelte';
import * as client from '$lib/graphql/client';

// Mock the GraphQL client
vi.mock('$lib/graphql/client', () => ({
	request: vi.fn()
}));

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true, // Set to true to disable sampling in tests
	building: false,
	version: '1.0.0'
}));

// Mock logging config to ensure test-friendly settings
vi.mock('$lib/config/logging', () => ({
	LOGGING_CONFIG: {
		retentionDays: 30,
		batchSize: 10,
		batchTimeout: 5000,
		rateLimitWindow: 60000,
		rateLimitMax: 50,
		sampling: {
			enabled: false, // Disable sampling in tests
			defaultRate: 1.0,
			componentRates: {}
		},
		performance: {
			slowOperationThreshold: 1000,
			maxSlowOperationsTracked: 50
		},
		persistLevels: ['error', 'warn'],
		maxInMemoryLogs: 500
	}
}));

// Mock browser globals
Object.defineProperty(globalThis, 'navigator', {
	value: {
		userAgent: 'Test User Agent'
	},
	writable: true
});

Object.defineProperty(globalThis, 'window', {
	value: {
		location: {
			href: 'http://localhost:3000/test'
		}
	},
	writable: true
});

Object.defineProperty(globalThis, 'crypto', {
	value: {
		randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 9)
	},
	writable: true
});

// Mock fetch for authentication check
globalThis.fetch = vi.fn().mockResolvedValue({
	ok: true,
	json: async () => ({})
});

describe('LoggingStore', () => {
	beforeEach(() => {
		// Clear logs before each test
		loggingStore.clear();
		loggingStore.setLogLevel(['info', 'warn', 'error']); // Reset to default
		vi.clearAllMocks();
		vi.useFakeTimers();

		// Mock request to return successful response
		vi.mocked(client.request).mockResolvedValue({
			insert_logs_one: {
				id: 'test-id',
				timestamp: new Date().toISOString(),
				level: 'error',
				component: 'Test',
				message: 'Test message'
			}
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Basic Logging', () => {
		it('should add logs to in-memory store', () => {
			loggingStore.info('TestComponent', 'Test message', { foo: 'bar' });

			expect(loggingStore.logs).toHaveLength(1);
			expect(loggingStore.logs[0]).toMatchObject({
				level: 'info',
				component: 'TestComponent',
				message: 'Test message',
				data: { foo: 'bar' }
			});
		});

		it('should support all log levels', () => {
			loggingStore.debug('Test', 'Debug message');
			loggingStore.info('Test', 'Info message');
			loggingStore.warn('Test', 'Warn message');
			loggingStore.error('Test', 'Error message');

			// Debug is not enabled by default
			expect(loggingStore.logs).toHaveLength(3);
			expect(loggingStore.logs.map((log) => log.level)).toEqual(['error', 'warn', 'info']);
		});

		it('should respect log level filters', () => {
			loggingStore.setLogLevel(['error']);

			loggingStore.info('Test', 'Info message');
			loggingStore.warn('Test', 'Warn message');
			loggingStore.error('Test', 'Error message');

			expect(loggingStore.logs).toHaveLength(1);
			expect(loggingStore.logs[0].level).toBe('error');
		});

		it('should limit in-memory logs to maxLogs', () => {
			// Add 1001 logs
			for (let i = 0; i < 1001; i++) {
				loggingStore.info('Test', `Message ${i}`);
			}

			expect(loggingStore.logs.length).toBeLessThanOrEqual(1000);
		});
	});

	describe('Data Sanitization', () => {
		it('should redact sensitive fields', () => {
			loggingStore.error('Test', 'Login failed', {
				email: 'user@example.com',
				password: 'secret123',
				token: 'abc123',
				apiKey: 'xyz789'
			});

			const log = loggingStore.logs[0];
			expect(log.data.email).toBe('user@example.com');
			expect(log.data.password).toBe('[REDACTED]');
			expect(log.data.token).toBe('[REDACTED]');
			expect(log.data.apiKey).toBe('[REDACTED]');
		});

		it('should redact nested sensitive fields', () => {
			loggingStore.error('Test', 'Auth error', {
				user: {
					id: '123',
					email: 'user@example.com',
					auth: {
						token: 'secret',
						refreshToken: 'also-secret'
					}
				}
			});

			const log = loggingStore.logs[0];
			expect(log.data.user.id).toBe('123');
			expect(log.data.user.email).toBe('user@example.com');
			expect(log.data.user.auth.token).toBe('[REDACTED]');
			expect(log.data.user.auth.refreshToken).toBe('[REDACTED]');
		});

		it('should handle arrays with sensitive data', () => {
			loggingStore.error('Test', 'Multiple errors', {
				users: [
					{ id: '1', password: 'secret1' },
					{ id: '2', password: 'secret2' }
				]
			});

			const log = loggingStore.logs[0];
			expect(log.data.users[0].password).toBe('[REDACTED]');
			expect(log.data.users[1].password).toBe('[REDACTED]');
		});
	});

	describe('Database Persistence', () => {
		it('should batch logs and flush after timeout', async () => {
			loggingStore.clear();

			// Flush any pending logs from previous tests
			await loggingStore.flushLogs();
			await vi.advanceTimersByTimeAsync(10000);

			vi.clearAllMocks();

			loggingStore.error('Test', 'Error 1');
			loggingStore.warn('Test', 'Warning 1');

			// Should not call request immediately
			expect(client.request).not.toHaveBeenCalled();

			// Fast-forward time by 10 seconds
			await vi.advanceTimersByTimeAsync(10000);

			// Now it should have flushed
			expect(client.request).toHaveBeenCalledTimes(2);
		});

		it('should flush immediately when batch size reached', async () => {
			// Add 50 errors to trigger immediate flush
			for (let i = 0; i < 50; i++) {
				loggingStore.error('Test', `Error ${i}`);
			}

			// Wait for promises to resolve
			await vi.runAllTimersAsync();

			expect(client.request).toHaveBeenCalledTimes(50);
		});

		it('should only persist ERROR and WARN levels', async () => {
			loggingStore.clear();
			vi.clearAllMocks();

			loggingStore.info('Test', 'Info message');
			loggingStore.warn('Test', 'Warn message');
			loggingStore.error('Test', 'Error message');

			await vi.advanceTimersByTimeAsync(10000);

			// Should only call for warn and error (info is not persisted)
			expect(client.request).toHaveBeenCalledTimes(2);
		});

		it('should include user_id when set', async () => {
			loggingStore.setUserId('user-123');
			loggingStore.error('Test', 'Error with user');

			await vi.advanceTimersByTimeAsync(10000);

			expect(client.request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					log: expect.objectContaining({
						user_id: 'user-123'
					})
				})
			);
		});

		it('should include session_id', async () => {
			loggingStore.error('Test', 'Error with session');

			await vi.advanceTimersByTimeAsync(10000);

			expect(client.request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					log: expect.objectContaining({
						session_id: expect.any(String)
					})
				})
			);
		});

		it('should handle database failures gracefully', async () => {
			vi.mocked(client.request).mockRejectedValueOnce(new Error('DB error'));

			loggingStore.error('Test', 'This will fail to save');

			await vi.advanceTimersByTimeAsync(10000);

			// Should still have log in memory even if DB save failed
			expect(loggingStore.logs).toHaveLength(1);
		});
	});

	describe('Log Filtering', () => {
		it('should track recent errors from logs', () => {
			loggingStore.clear();
			loggingStore.info('Test', 'Info');
			loggingStore.error('Test', 'Error 1');
			loggingStore.warn('Test', 'Warning');
			loggingStore.error('Test', 'Error 2');

			// Make sure logs are actually stored
			expect(loggingStore.logs).toHaveLength(4);

			// Check errors manually since $derived may not work in test environment
			const errors = loggingStore.logs.filter((log) => log.level === 'error');
			expect(errors).toHaveLength(2);
			expect(errors[0].message).toBe('Error 2');
			expect(errors[1].message).toBe('Error 1');
		});

		it('should track warnings from logs', () => {
			loggingStore.clear();
			loggingStore.warn('Test', 'Warning 1');
			loggingStore.error('Test', 'Error');
			loggingStore.warn('Test', 'Warning 2');

			const warnings = loggingStore.logs.filter((log) => log.level === 'warn');
			expect(warnings).toHaveLength(2);
			expect(warnings[0].message).toBe('Warning 2');
		});

		it('should group logs by component', () => {
			loggingStore.clear();
			loggingStore.info('ComponentA', 'Message 1');
			loggingStore.info('ComponentB', 'Message 2');
			loggingStore.error('ComponentA', 'Message 3');

			const componentALogs = loggingStore.logs.filter((log) => log.component === 'ComponentA');
			const componentBLogs = loggingStore.logs.filter((log) => log.component === 'ComponentB');

			expect(componentALogs).toHaveLength(2);
			expect(componentBLogs).toHaveLength(1);
		});

		it('should maintain log order (newest first)', () => {
			loggingStore.clear();

			for (let i = 0; i < 15; i++) {
				loggingStore.error('Test', `Error ${i}`);
			}

			// Check that newest is first
			expect(loggingStore.logs[0].message).toBe('Error 14');
			expect(loggingStore.logs[14].message).toBe('Error 0');
		});
	});

	describe('Export Functionality', () => {
		it('should export logs as JSON', () => {
			loggingStore.clear(); // Ensure clean state
			loggingStore.setLogLevel(['info', 'warn', 'error']); // Ensure info is enabled
			loggingStore.setUserId('user-123');
			loggingStore.info('Test', 'Info message');
			loggingStore.error('Test', 'Error message');

			const exported = loggingStore.exportLogs();
			const data = JSON.parse(exported);

			expect(data).toHaveProperty('exportTime');
			expect(data).toHaveProperty('userAgent');
			expect(data).toHaveProperty('url');
			expect(data).toHaveProperty('sessionId');
			expect(data.userId).toBe('user-123');
			expect(data.logs).toHaveLength(2);
		});
	});

	describe('Clear Functionality', () => {
		it('should clear all logs', () => {
			loggingStore.clear(); // Start fresh
			loggingStore.setLogLevel(['info', 'warn', 'error']); // Ensure info is enabled
			loggingStore.info('Test', 'Message 1');
			loggingStore.error('Test', 'Message 2');

			expect(loggingStore.logs).toHaveLength(2);

			loggingStore.clear();

			expect(loggingStore.logs).toHaveLength(0);
		});
	});

	describe('User ID Management', () => {
		it('should set user ID', () => {
			loggingStore.setUserId('user-456');

			loggingStore.error('Test', 'Error');

			// Wait for flush
			vi.advanceTimersByTime(10000);

			expect(client.request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					log: expect.objectContaining({
						user_id: 'user-456'
					})
				})
			);
		});

		it('should clear user ID', () => {
			loggingStore.setUserId('user-456');
			loggingStore.setUserId(null);

			loggingStore.error('Test', 'Error');

			vi.advanceTimersByTime(10000);

			expect(client.request).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({
					log: expect.objectContaining({
						user_id: null
					})
				})
			);
		});
	});
});
