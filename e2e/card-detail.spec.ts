/** @file e2e/card-detail.spec.ts */
// The card detail modal: opens from the board (?card=<alias>), offers the image upload area, and
// closes back to the board via Close or Escape. Works in its own temp list (see ./board.ts).
import { test, expect, type Locator, type Page } from '@playwright/test';
import { addCards, createList, deleteList, gotoBoard } from './board';

const stamp = Date.now();
const LIST = `CardDetail ${stamp}`;
const TITLE = `Detail card ${stamp}`;

test.describe.serial('Card detail', () => {
	let page: Page;
	let list: Locator;

	/** Open the card from the board and wait for its dialog. */
	async function openCard() {
		await list.locator('[data-todo-id]', { hasText: TITLE }).getByRole('heading').click();
		await expect(page).toHaveURL(/[?&]card=/);
		const dialog = page.getByRole('dialog');
		await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue(TITLE);
		return dialog;
	}

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(60_000);
		page = await browser.newPage();
		await gotoBoard(page);
		list = await createList(page, LIST);
		await addCards(list, [TITLE]);
	});

	test.afterAll(async () => {
		await deleteList(page, list);
		await page.close();
	});

	test('opens from the board without a full "loading" state', async () => {
		await openCard();
		await expect(page.getByText(/loading your cards/i)).toHaveCount(0);
		await page.keyboard.press('Escape');
		await expect(page).not.toHaveURL(/[?&]card=/);
	});

	test('shows an accessible upload area after "Attach images"', async () => {
		const dialog = await openCard();
		await expect(dialog.getByText(/Attachments \(\d+\)/)).toBeVisible();
		await dialog.getByRole('button', { name: 'Attach images' }).click();
		const upload = dialog.getByRole('button', { name: /upload images by dragging/i });
		await expect(upload).toBeVisible();
		await expect(upload).toHaveAttribute('tabindex', '0');
		await expect(dialog.getByText(/drag and drop images here/i)).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page).not.toHaveURL(/[?&]card=/);
	});

	test('Close returns to the board with the card still there', async () => {
		const dialog = await openCard();
		await dialog.getByRole('button', { name: 'Close', exact: true }).click();
		await expect(page).not.toHaveURL(/[?&]card=/);
		await expect(list.locator('[data-todo-id]', { hasText: TITLE })).toBeVisible();
	});
});
