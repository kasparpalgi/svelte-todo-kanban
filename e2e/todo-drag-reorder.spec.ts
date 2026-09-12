/** @file e2e/todo-drag-reorder.spec.ts */
// End-to-end coverage for card reordering on a board — the drag'n'drop polish from tasks 163/180.
// Guards both non-pointer (Ctrl/Cmd+arrow keyboard) and pointer (mouse drag) reordering against
// regressions in the hand-rolled DnD wiring. The touch-scroll race the 180 fix targeted is covered
// at the unit layer (src/lib/utils/__tests__/cardDrag.svelte.test.ts), which can assert
// preventDefault/cancelability far more reliably than a synthetic e2e touch can.
//
// It works on the test user's own board and creates a uniquely-named list which it deletes on the
// way out, so runs stay isolated and don't accumulate fixtures. The board path is configurable for
// other environments via TEST_BOARD_PATH (default: the seeded test account's board).
import { test, expect, type Page } from '@playwright/test';

const stamp = Date.now();
const BOARD_PATH = process.env.TEST_BOARD_PATH || '/en/test/tests-board';
const LIST = `Reorder ${stamp}`;
const CARDS = [`Alpha ${stamp}`, `Bravo ${stamp}`, `Charlie ${stamp}`];

/** Titles of the cards in `LIST`, top-to-bottom, as currently rendered. */
async function listOrder(page: Page): Promise<string[]> {
	return page.evaluate((listName) => {
		const col = Array.from(document.querySelectorAll('[data-list-id]')).find((el) =>
			(el.textContent || '').includes(listName)
		);
		if (!col) return [];
		return Array.from(col.querySelectorAll('[data-todo-id] h3')).map(
			(h) => h.textContent?.trim() || ''
		);
	}, LIST);
}

/** Dismiss any open overlay/modal so the next interaction is not intercepted. */
async function closeModals(page: Page) {
	for (let i = 0; i < 4; i++) {
		if ((await page.locator('.fixed.inset-0.z-50').count()) === 0) return;
		const close = page.getByRole('button', { name: '✕' });
		if (await close.count()) {
			await close
				.first()
				.click({ timeout: 1000 })
				.catch(() => {});
		} else {
			await page.keyboard.press('Escape');
		}
		await page.waitForTimeout(150);
	}
}

test.describe.serial('Board card reordering', () => {
	let page: Page;

	test.beforeAll(async ({ browser }) => {
		test.setTimeout(90_000);
		page = await browser.newPage();
		// The list delete in afterAll goes through the app's native confirm() dialog.
		page.on('dialog', (dialog) => dialog.accept().catch(() => {}));

		await page.goto(BOARD_PATH);
		// Board is hydrated once its "Create list" affordance is interactive.
		await expect(page.getByRole('button', { name: 'Create list' }).first()).toBeVisible({
			timeout: 20_000
		});

		// Add a uniquely-named list via the Manage Lists → New List flow.
		await page.getByRole('button', { name: 'Create list' }).first().click();
		await page.getByRole('button', { name: 'New List' }).first().click();
		await page.getByRole('textbox', { name: 'List Name' }).fill(LIST);
		await page.getByRole('dialog').getByRole('button', { name: 'Create list' }).first().click();
		await closeModals(page);

		const list = page.locator('[data-list-id]', { hasText: LIST });
		await expect(list).toBeVisible();

		// Add three cards.
		await list.getByRole('button', { name: 'Add task' }).click();
		const input = page.locator('input[placeholder="Enter task title..."]');
		for (const title of CARDS) {
			await input.fill(title);
			await input.press('Enter');
			await expect(list.locator('[data-todo-id]', { hasText: title })).toBeVisible();
		}

		expect(await listOrder(page)).toEqual(CARDS);
	});

	test.afterAll(async () => {
		// Best-effort cleanup: delete the temp list (removes its cards).
		try {
			const list = page.locator('[data-list-id]', { hasText: LIST });
			await list.getByRole('button').nth(1).click(); // list menu (ellipsis)
			await page.getByRole('menuitem', { name: /delete list/i }).click(); // confirm auto-accepted
			await expect(list).toBeHidden({ timeout: 5000 });
		} catch {
			// leave the list if the menu shifted — the assertions already ran
		}
		await page.close();
	});

	test('reorders a card down with Ctrl+ArrowDown', async () => {
		const cardLink = page
			.locator('[data-todo-id]', { hasText: CARDS[0] })
			.locator('a[href][aria-keyshortcuts]');
		await cardLink.focus();
		await page.keyboard.press('Control+ArrowDown');

		await expect.poll(() => listOrder(page)).toEqual([CARDS[1], CARDS[0], CARDS[2]]);
	});

	test('reorders a card to the top with a mouse drag', async () => {
		const before = await listOrder(page);
		const last = before[before.length - 1];
		const first = before[0];

		const src = await page.locator('[data-todo-id]', { hasText: last }).boundingBox();
		const dst = await page.locator('[data-todo-id]', { hasText: first }).boundingBox();
		if (!src || !dst) throw new Error('card bounding boxes unavailable');

		await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
		await page.mouse.down();
		// Cross the 6px activation threshold, then hover the target card's upper half → drop above.
		await page.mouse.move(src.x + src.width / 2 + 12, src.y + src.height / 2 + 12, { steps: 4 });
		await page.mouse.move(dst.x + dst.width / 2, dst.y + 6, { steps: 14 });
		await page.mouse.move(dst.x + dst.width / 2, dst.y + 6, { steps: 2 });
		await page.mouse.up();

		await expect.poll(() => listOrder(page).then((o) => o[0])).toBe(last);
	});
});
