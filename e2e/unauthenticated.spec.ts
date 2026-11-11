/** @file e2e/unauthenticated.spec.ts */
import { test, expect } from '@playwright/test';

test.describe('Unauthenticated user flow', () => {
	test('root shows the landing page with a way to sign in', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Get Started Free' }).click();
		await expect(page).toHaveURL(/\/signin/);
		await expect(page.getByRole('button', { name: 'Sign in with Password' })).toBeVisible();
	});

	test('shows Google and email + password sign-in', async ({ page }) => {
		await page.goto('/signin');
		await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign in with Password' })).toBeVisible();
		await expect(page.getByRole('button', { name: /magic link/i })).toBeVisible();
	});

	test('accepts typed credentials', async ({ page }) => {
		await page.goto('/signin');
		const email = page.getByRole('textbox', { name: 'Email' });
		await email.fill('user@example.com');
		await expect(email).toHaveValue('user@example.com');
		await expect(page.getByRole('button', { name: 'Sign in with Password' })).toBeEnabled();
	});
});
