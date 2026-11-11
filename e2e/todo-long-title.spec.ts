/** @file e2e/todo-long-title.spec.ts */
// #210: a card whose title is one long unbroken word must wrap inside the card, not spill out.
// Uses a uniquely-named temp list on the test board and deletes it afterwards.
import { test, expect } from '@playwright/test';
import { addCards, createList, deleteList, gotoBoard } from './board';

const stamp = Date.now();
const LIST = `LongTitle ${stamp}`;
const TITLE = `Supercalifragilisticexpialidocious${'x'.repeat(60)}${stamp}`;

test('a long one-word title stays inside its card', async ({ page }) => {
	test.setTimeout(90_000);
	await gotoBoard(page);
	const list = await createList(page, LIST);
	try {
		await addCards(list, [TITLE]);
		const card = list.locator('[data-todo-id]', { hasText: TITLE });
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
		await deleteList(page, list);
	}
});
