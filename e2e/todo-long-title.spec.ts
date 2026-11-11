/** @file e2e/todo-long-title.spec.ts */
// #210: a card whose title is one long unbroken word must wrap inside the card, not spill out.
// Uses a uniquely-named temp list on the test board and deletes it afterwards.
import { test, expect, type Page } from '@playwright/test';

const stamp = Date.now();
const BOARD_PATH = process.env.TEST_BOARD_PATH || '/en/test/tests-board';
const LIST = `LongTitle ${stamp}`;
const TITLE = `Supercalifragilisticexpialidocious${'x'.repeat(60)}${stamp}`;

/** Dismiss any open overlay/modal (same approach as todo-drag-reorder.spec.ts). */
async function closeModals(page: Page) {
	for (let i = 0; i < 4 && (await page.locator('.fixed.inset-0.z-50').count()); i++) {
		const close = page.getByRole('button', { name: '✕' });
		if (await close.count())
			await close
				.first()
				.click({ timeout: 1000 })
				.catch(() => {});
		else await page.keyboard.press('Escape');
		await page.waitForTimeout(150);
	}
}

test('a long one-word title stays inside its card', async ({ page }) => {
	test.setTimeout(90_000);
	page.on('dialog', (dialog) => dialog.accept().catch(() => {}));

	await page.goto(BOARD_PATH);
	const createList = page.getByRole('button', { name: 'Create list' }).first();
	await expect(createList).toBeVisible({ timeout: 20_000 });
	await createList.click();
	await page.getByRole('button', { name: 'New List' }).first().click();
	await page.getByRole('textbox', { name: 'List Name' }).fill(LIST);
	await page.getByRole('dialog').getByRole('button', { name: 'Create list' }).first().click();
	await closeModals(page);

	const list = page.locator('[data-list-id]', { hasText: LIST });
	await expect(list).toBeVisible();
	try {
		await list.getByRole('button', { name: 'Add task' }).click();
		const input = page.locator('input[placeholder="Enter task title..."]');
		await input.fill(TITLE);
		await input.press('Enter');

		const card = list.locator('[data-todo-id]', { hasText: TITLE });
		await expect(card).toBeVisible();
		const { cardRight, titleRight, overflow } = await card.evaluate((el) => {
			const h3 = el.querySelector('h3')!;
			return {
				cardRight: el.getBoundingClientRect().right,
				titleRight: h3.getBoundingClientRect().right,
				overflow: h3.scrollWidth - h3.clientWidth
			};
		});
		expect(overflow).toBeLessThanOrEqual(0);
		expect(titleRight).toBeLessThanOrEqual(cardRight);
	} finally {
		await list.getByRole('button').nth(1).click(); // list menu (ellipsis)
		await page.getByRole('menuitem', { name: /delete list/i }).click();
		await expect(list).toBeHidden({ timeout: 5000 });
	}
});
