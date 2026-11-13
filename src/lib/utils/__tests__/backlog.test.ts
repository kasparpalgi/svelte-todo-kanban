/** @file src/lib/utils/__tests__/backlog.test.ts */
import { describe, it, expect } from 'vitest';
import { rankBacklog } from '../backlog';
import type { BoardTodo } from '$lib/types/todo';

const card = (id: string, list: { id: string; sort_order: number }, sort_order: number) =>
	({ id, sort_order, list: { ...list, name: list.id } }) as unknown as BoardTodo;

const todo = { id: 'todo', sort_order: 1 };
const doing = { id: 'doing', sort_order: 2 };

describe('rankBacklog', () => {
	it('keeps the board order it is given and numbers cards across boards', () => {
		const sections = rankBacklog([{ id: 'b2' }, { id: 'b1' }], {
			b1: [card('x', todo, 1)],
			b2: [card('y', todo, 1), card('z', todo, 2)]
		});
		expect(sections.map((s) => s.board.id)).toEqual(['b2', 'b1']);
		expect(sections.flatMap((s) => s.cards.map((c) => [c.todo.id, c.rank]))).toEqual([
			['y', 1],
			['z', 2],
			['x', 3]
		]);
	});

	it('orders a board like its kanban: lists left to right, then cards top to bottom', () => {
		const [section] = rankBacklog([{ id: 'b' }], {
			b: [card('d2', doing, 2), card('t2', todo, 2), card('d1', doing, 1), card('t1', todo, 1)]
		});
		expect(section.cards.map((c) => c.todo.id)).toEqual(['t1', 't2', 'd1', 'd2']);
	});

	it('puts unsorted lists and cards last, as the board does', () => {
		const unsorted = { id: 'later', sort_order: 0 };
		const [section] = rankBacklog([{ id: 'b' }], {
			b: [card('u', unsorted, 1), card('t0', todo, 0), card('t5', todo, 5)]
		});
		expect(section.cards.map((c) => c.todo.id)).toEqual(['t5', 't0', 'u']);
	});

	it('skips boards with no cards and boards it was not given', () => {
		const sections = rankBacklog([{ id: 'empty' }, { id: 'b' }], {
			b: [card('x', todo, 1)],
			archived: [card('gone', todo, 1)]
		});
		expect(sections.map((s) => s.board.id)).toEqual(['b']);
	});
});
