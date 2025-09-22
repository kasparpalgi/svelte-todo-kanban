/** @file e2e/auth.setup.ts */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate with test user', async ({ page }) => {
	await page.goto('/auth/signin');

	const testLoginContainer = page.locator('div.provider').filter({
		hasText: 'Sign in with Test Login'
	});

	const emailInput = testLoginContainer.getByRole('textbox');
	await expect(emailInput).toBeVisible({ timeout: 10000 });
	await emailInput.fill('test@test.com');

	const testLoginButton = testLoginContainer.getByRole('button');
	await expect(testLoginButton).toBeEnabled();
	await testLoginButton.click();
	await page.waitForURL('/', { timeout: 10000 });
	await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
	await page.context().storageState({ path: authFile });
});
