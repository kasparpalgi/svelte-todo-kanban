/** @file e2e/todo-drag-reorder.spec.ts */
// End-to-end coverage for card reordering on a board — the drag'n'drop polish from tasks 163/180.
// Guards both non-pointer (Ctrl/Cmd+arrow keyboard) and pointer (mouse drag) reordering against
// regressions in the hand-rolled DnD wiring. The touch-scroll race the 180 fix targeted is covered
// at the unit layer (src/lib/utils/__tests__/cardDrag.svelte.test.ts), which can assert
// preventDefault/cancelability far more reliably than a synthetic e2e touch can.
//
// It works on the test user's own board and creates a uniquely-named list which it deletes on the
// way out, so runs stay isolated and don't accumulate fixtures. The board path is configurable for
// other environments via TEST_BOARD_PATH (see ./board.ts).
import { test, expect, type Locator, type Page } from '@playwright/test';
import { addCards, createList, deleteList, gotoBoard } from './board';

// Named per run in beforeAll: the module loads once per worker, so a module-level stamp
// gave every --repeat-each run the same list, and one failed cleanup broke the next run.
let LIST = '';
let CARDS: string[] = [];

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

test.describe.serial('Board card reordering', () => {
	let page: Page;
	let list: Locator;

	test.beforeAll(async ({ browser }, testInfo) => {
		test.setTimeout(90_000);
		const stamp = `${Date.now()}-${testInfo.repeatEachIndex}`;
		LIST = `Reorder ${stamp}`;
		CARDS = [`Alpha ${stamp}`, `Bravo ${stamp}`, `Charlie ${stamp}`];
		page = await browser.newPage();
		await gotoBoard(page);
		list = await createList(page, LIST);
		await addCards(list, CARDS);

		expect(await listOrder(page)).toEqual(CARDS);
	});

	test.afterAll(async () => {
		await deleteList(page, list);
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

		const target = page.locator('[data-todo-id]', { hasText: first });
		const src = await page.locator('[data-todo-id]', { hasText: last }).boundingBox();
		const dst = await target.boundingBox();
		if (!src || !dst) throw new Error('card bounding boxes unavailable');

		await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
		await page.mouse.down();
		// Cross the 6px activation threshold, then hover the target card.
		await page.mouse.move(src.x + src.width / 2 + 12, src.y + src.height / 2 + 12, { steps: 4 });
		await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 4, { steps: 14 });
		// Mid-drag the drop indicator shifts the cards a few px, so re-measure and settle on the
		// target's upper quarter ("drop above") — a fixed offset from the old top edge could land
		// in the gap and drop at the end of the list instead.
		const now = await target.boundingBox();
		if (!now) throw new Error('target card vanished mid-drag');
		await page.mouse.move(now.x + now.width / 2, now.y + now.height / 4, { steps: 4 });
		await page.mouse.up();

		await expect.poll(() => listOrder(page).then((o) => o[0])).toBe(last);
	});
});
