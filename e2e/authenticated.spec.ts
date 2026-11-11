/** @file e2e/authenticated.spec.ts */
// Signed-in basics: the root lands on a board, and a list's quick-add creates cards.
import { test, expect, type Locator, type Page } from '@playwright/test';
import { addCards, createList, deleteList, gotoBoard } from './board';

const stamp = Date.now();
const LIST = `QuickAdd ${stamp}`;

test('root lands a signed-in user on a board', async ({ page }) => {
	await page.goto('/');
	await expect(page).not.toHaveURL(/\/signin/);
	await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible({
		timeout: 20_000
	});
});

test.describe.serial('Quick add', () => {
	let page: Page;
	let list: Locator;

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(60_000);
		page = await browser.newPage();
		await gotoBoard(page);
		list = await createList(page, LIST);
	});

	test.afterAll(async () => {
		await deleteList(page, list);
		await page.close();
	});

	test('creates several cards with Enter and clears the input', async () => {
		const titles = ['First', 'Second', 'Third'].map((t) => `${t} ${stamp}`);
		await addCards(list, titles);
		await expect(list.locator('input[id^="quickaddBottom-"]')).toHaveValue('');
		await expect(list.locator('[data-todo-id]')).toHaveCount(titles.length);
	});

	test('ignores a blank title', async () => {
		const before = await list.locator('[data-todo-id]').count();
		const input = list.locator('input[id^="quickaddBottom-"]');
		await input.fill('   ');
		await input.press('Enter');
		await page.waitForTimeout(500);
		await expect(list.locator('[data-todo-id]')).toHaveCount(before);
	});
});
