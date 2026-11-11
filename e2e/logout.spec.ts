/** @file e2e/logout.spec.ts */
// Logout through the user menu. Auth.js uses JWT sessions, so signing out here only clears this
// test's own cookies — the shared storageState used by the other specs stays valid.
import { test, expect, type Page } from '@playwright/test';
import { gotoBoard } from './board';

async function logout(page: Page) {
	await gotoBoard(page);
	await page.getByRole('button', { name: 'Open menu' }).first().click();
	// Wait for the POST /logout itself: the client can route to /signin before the cookie-clearing
	// response lands, and navigating away then would abort it and leave the session alive.
	const loggedOut = page.waitForResponse((r) => new URL(r.url()).pathname === '/logout');
	await page.getByRole('menuitem', { name: 'Logout' }).click();
	await loggedOut;
	await page.waitForURL(/\/signin/, { timeout: 10_000 });
}

test.describe('Logout', () => {
	test('clears app storage and shows the sign-in page', async ({ page }) => {
		await logout(page);
		await expect(page.getByRole('button', { name: 'Sign in with Password' })).toBeVisible();
		const keys = await page.evaluate(() => Object.keys(localStorage));
		expect(keys).not.toContain('selectedBoardId');
		expect(keys).not.toContain('todo-filtering-preferences');
	});

	test('protected routes redirect to sign-in afterwards', async ({ page }) => {
		await logout(page);
		await page.goto('/en');
		await page.waitForURL(/\/signin/, { timeout: 10_000 });
	});
});
