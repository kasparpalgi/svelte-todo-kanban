/** @file src/lib/config/logging.ts */
import { dev } from '$app/environment';

export const LOGGING_CONFIG = {
	// Retention policy
	retentionDays: 30,

	// Batch configuration
	batchSize: dev ? 10 : 50, // Smaller batches in dev for faster testing
	batchTimeout: dev ? 5000 : 10000, // 5s in dev, 10s in production

	// Rate limiting
	rateLimitWindow: 60000, // 1 minute
	rateLimitMax: dev ? 50 : 100, // Lower limit in dev

	// Sampling configuration
	sampling: {
		enabled: !dev, // Only enable in production
		defaultRate: 0.1, // 10% sampling for INFO logs
		// Component-specific rates
		componentRates: {
			// High-volume components get more aggressive sampling
			UserStore: 0.05, // 5%
			TodoStore: 0.1, // 10%
			BoardStore: 0.1, // 10%
			// Low-volume or critical components get full logging
			AuthService: 1.0, // 100% (no sampling)
			PaymentService: 1.0, // 100% (no sampling)
			ErrorBoundary: 1.0 // 100% (no sampling)
		}
	},

	// Performance monitoring
	performance: {
		slowOperationThreshold: 1000, // milliseconds
		maxSlowOperationsTracked: 50
	},

	// Log levels to persist to database
	persistLevels: ['error', 'warn'] as const,

	// Maximum in-memory logs
	maxInMemoryLogs: dev ? 500 : 1000
} as const;

export type LoggingConfig = typeof LOGGING_CONFIG;
