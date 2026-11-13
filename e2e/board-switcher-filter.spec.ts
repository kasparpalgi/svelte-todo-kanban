/** @file e2e/board-switcher-filter.spec.ts */
// #238: the board switcher opens with a focused filter input; typing narrows the list and Enter
// opens the top match.
import { test, expect } from '@playwright/test';
import { BOARD_PATH, gotoBoard } from './board';

test('board switcher: type to filter, Enter opens the top board', async ({ page }) => {
	await gotoBoard(page);
	await page.locator('button:has(svg.lucide-chevron-down)').first().click();

	const filter = page.getByRole('searchbox', { name: 'Type to filter, Enter to open…' });
	await expect(filter).toBeFocused();

	const alias = BOARD_PATH.split('/').pop()!;
	await page.keyboard.type('zzzz-no-such-board');
	await expect(page.getByText('No boards yet')).toBeVisible();

	await filter.fill(alias);
	await page.keyboard.press('Enter');
	await expect(filter).toBeHidden();
	await expect(page).toHaveURL(new RegExp(`/${alias}$`));
});
