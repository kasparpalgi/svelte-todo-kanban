/** @file e2e/unauthenticated.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Unauthenticated user flow', () => {
	test('should show login form on homepage', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText(/sign in/i)).toBeVisible();
	});

	test('should display all login options', async ({ page }) => {
		await page.goto('/signin');
		await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
		await expect(page.getByRole('textbox')).toBeVisible();

		const testButton = page.getByText(/test login/i);
		if (await testButton.isVisible()) {
			await expect(testButton).toBeVisible();
		}
	});

	test('should enable email sign-in button when email is filled', async ({ page }) => {
		await page.goto('/signin');

		const emailInput = page.getByRole('textbox');
		const emailButton = page.getByRole('button', { name: /sign in with email/i });

		await emailInput.fill('user@example.com');
		await expect(emailButton).toBeEnabled();
	});
});
