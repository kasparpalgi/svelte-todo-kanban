import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',

	use: {
		baseURL: 'http://localhost:4173',
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
			testMatch: /.*authenticated\.spec\.ts/
		},
		{
			name: 'unauthenticated',
			use: { ...devices['Desktop Chrome'] },
			testMatch: /.*unauthenticated\.spec\.ts/
		}
	],

	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
