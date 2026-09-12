/** @file e2e/auth.setup.ts */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// Credentials come from .env.test (gitignored), loaded by playwright.config.ts. Never hardcode
// them here — this file is committed.
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

setup('authenticate with test user', async ({ page }) => {
	if (!email || !password) {
		throw new Error(
			'Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test to run authenticated e2e tests.'
		);
	}

	await page.goto('/signin');

	await page.locator('#email').fill(email);
	await page.locator('#password').fill(password);
	await page.getByRole('button', { name: 'Sign in with Password' }).click();

	// The credentials provider redirects to the localized app root once the session is set.
	await page.waitForURL((url) => !url.pathname.startsWith('/signin'), { timeout: 15000 });
	await expect(page.locator('nav button:has(.lucide-chevron-down)').first()).toBeVisible({
		timeout: 15000
	});

	await page.context().storageState({ path: authFile });
});
