/** @file e2e/podcasts.spec.ts */
import { test, expect } from '@playwright/test';

/**
 * Podcasts page E2E tests.
 * The /podcasts route is public (no auth required).
 * It loads data from the Hasura REST endpoint with anonymous role.
 */
test.describe('Podcasts page', () => {
	test('should load the podcasts page', async ({ page }) => {
		await page.goto('/podcasts');
		await expect(page.getByRole('heading', { name: /podcast/i })).toBeVisible();
	});

	test('should display at least one podcast from the server', async ({ page }) => {
		await page.goto('/podcasts');

		// Wait for loading to complete
		await expect(page.locator('[data-testid="podcasts-list"], [data-testid="no-podcasts-message"]')).toBeVisible({ timeout: 15000 });

		// We expect at least one podcast card to be present (seed data exists)
		const podcastList = page.locator('[data-testid="podcasts-list"]');
		await expect(podcastList).toBeVisible();

		const podcastCards = podcastList.locator('[data-testid="podcast-card"]');
		const count = await podcastCards.count();
		expect(count).toBeGreaterThan(0);
		console.log(`Found ${count} podcast(s) on the page`);
	});

	test('should not display loading error after podcasts load', async ({ page }) => {
		await page.goto('/podcasts');

		// Wait for content to settle
		await expect(page.locator('[data-testid="podcasts-list"], [data-testid="no-podcasts-message"]')).toBeVisible({ timeout: 15000 });

		// No error banner should be visible
		const errorBanner = page.locator('.border-red-200');
		await expect(errorBanner).not.toBeVisible();
	});

	test('should show "Add / transcribe podcast" button', async ({ page }) => {
		await page.goto('/podcasts');
		const addBtn = page.getByRole('button', { name: /add.*transcribe|transcribe.*add/i });
		await expect(addBtn).toBeVisible();
	});

	test('should open add form when button is clicked', async ({ page }) => {
		await page.goto('/podcasts');

		const addBtn = page.getByRole('button', { name: /add.*transcribe|transcribe.*add/i });
		await addBtn.click();

		// Dialog should open with required fields
		await expect(page.getByLabel(/podcast name/i)).toBeVisible();
		await expect(page.getByLabel(/audio url/i)).toBeVisible();
	});

	test('should show view transcription button for each podcast', async ({ page }) => {
		await page.goto('/podcasts');
		await expect(page.locator('[data-testid="podcasts-list"]')).toBeVisible({ timeout: 15000 });

		const viewBtns = page.locator('[data-testid="view-transcription-btn"]');
		const count = await viewBtns.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should open transcription dialog when view button clicked', async ({ page }) => {
		await page.goto('/podcasts');
		await expect(page.locator('[data-testid="podcasts-list"]')).toBeVisible({ timeout: 15000 });

		const firstViewBtn = page.locator('[data-testid="view-transcription-btn"]').first();
		await firstViewBtn.click();

		// Dialog should open
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('should show audio link for each podcast', async ({ page }) => {
		await page.goto('/podcasts');
		await expect(page.locator('[data-testid="podcasts-list"]')).toBeVisible({ timeout: 15000 });

		const audioLinks = page.locator('[data-testid="podcast-audio-link"]');
		const count = await audioLinks.count();
		expect(count).toBeGreaterThan(0);
	});
});
