/** @file e2e/auth.setup.ts */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate with test user', async ({ page }) => {
	await page.goto('/signin');

	const testLoginButton = page.getByText('🧪 Test Login');
	
	if (await testLoginButton.isVisible()) {
		await testLoginButton.click();
	} else {
		await page.evaluate(async () => {
			const response = await fetch('/signin/test-credentials', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					email: 'test@test.com',
					callbackUrl: '/'
				}),
			});
		});
	}

	await page.waitForURL('/', { timeout: 10000 });
	await expect(page.getByRole('heading', { name: /today/i })).toBeVisible();
	await page.context().storageState({ path: authFile });
});