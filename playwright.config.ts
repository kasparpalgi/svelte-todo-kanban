import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.test' });

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',

	use: {
		baseURL: 'http://localhost:4173/en',
		trace: 'on-first-retry'
	},

	projects: [
		{
			name: 'setup',
			testMatch: /.*\.setup\.ts/
		},
		{
			name: 'authenticated',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'playwright/.auth/user.json'
			},
			dependencies: ['setup'],
			testIgnore: /.*unauthenticated\.spec\.ts/
		},
		{
			name: 'unauthenticated',
			use: { ...devices['Desktop Chrome'] },
			testMatch: /.*unauthenticated\.spec\.ts/
		}
	],
	webServer: {
		command: 'cross-env NODE_ENV=test dotenv -e .env.test -- npm run build && npm run preview',
		url: 'http://localhost:4173/en',
		timeout: 120 * 1000,
		reuseExistingServer: !process.env.CI
	}
});
