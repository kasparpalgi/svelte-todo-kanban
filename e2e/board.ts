/** @file e2e/board.ts */
// Shared board helpers for the authenticated specs. Each spec works in its own uniquely-named temp
// list on the test user's board and deletes it afterwards, so parallel workers never see each
// other's cards and nothing accumulates on production Hasura.
import { expect, type Locator, type Page } from '@playwright/test';

export const BOARD_PATH = process.env.TEST_BOARD_PATH || '/en/test/tests-board';

/** Open the test board and wait until it is hydrated (its "Create list" button is interactive). */
export async function gotoBoard(page: Page) {
	await page.goto(BOARD_PATH);
	await expect(page.getByRole('button', { name: 'Create list' }).first()).toBeVisible({
		timeout: 20_000
	});
}

/** Dismiss any open overlay/modal so the next interaction is not intercepted. */
export async function closeModals(page: Page) {
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

/** Create a list via Manage Lists → New List and return its column. Board must be open. */
export async function createList(page: Page, name: string): Promise<Locator> {
	// The list delete in deleteList goes through the app's native confirm() dialog.
	page.on('dialog', (dialog) => dialog.accept().catch(() => {}));
	await page.getByRole('button', { name: 'Create list' }).first().click();
	await page.getByRole('button', { name: 'New List' }).first().click();
	await page.getByRole('textbox', { name: 'List Name' }).fill(name);
	await page.getByRole('dialog').getByRole('button', { name: 'Create list' }).first().click();
	await closeModals(page);
	const list = page.locator('[data-list-id]', { hasText: name });
	await expect(list).toBeVisible();
	return list;
}

/** Add cards to `list` through its top quick-add input (scoped to this list only). */
export async function addCards(list: Locator, titles: string[]) {
	await list.getByRole('button', { name: 'Add task' }).click();
	// The top input (`quickadd-…`) closes after a submit; from then on the list shows its bottom
	// one (`quickaddBottom-…`), which appends — so titles still land top-to-bottom in order.
	const input = list.locator('input[id^="quickadd"]').first();
	for (const title of titles) {
		await input.fill(title);
		await input.press('Enter');
		await expect(list.locator('[data-todo-id]', { hasText: title })).toBeVisible();
	}
}

/** Best-effort delete of a list (and its cards) through its ellipsis menu. */
export async function deleteList(page: Page, list: Locator) {
	try {
		await closeModals(page);
		await list.getByRole('button').nth(1).click(); // list menu (ellipsis)
		await page.getByRole('menuitem', { name: /delete list/i }).click(); // confirm auto-accepted
		await expect(list).toBeHidden({ timeout: 5000 });
	} catch {
		// leave the list if the menu shifted — the assertions already ran
	}
}
