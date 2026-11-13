/** @file src/lib/utils/backlog.ts */
// The combined backlog (#241): every open card of every board, in the order the user
// already set on the kanban — boards as the switcher sorts them, then lists left to
// right, then cards top to bottom. The same `|| 999` defaults as the board view.
import type { BoardTodo } from '$lib/types/todo';

export type BacklogCard = { todo: BoardTodo; rank: number };
export type BacklogSection<B> = { board: B; cards: BacklogCard[] };

function kanbanOrder(a: BoardTodo, b: BoardTodo): number {
	return (
		(a.list?.sort_order || 999) - (b.list?.sort_order || 999) ||
		(a.list?.id ?? '').localeCompare(b.list?.id ?? '') ||
		(a.sort_order || 999999) - (b.sort_order || 999999)
	);
}

/** One section per board with cards, numbered 1…n across all of them. */
export function rankBacklog<B extends { id: string }>(
	boards: B[],
	cardsByBoard: Record<string, BoardTodo[] | undefined>
): BacklogSection<B>[] {
	let rank = 0;
	const sections: BacklogSection<B>[] = [];
	for (const board of boards) {
		const cards = [...(cardsByBoard[board.id] ?? [])].sort(kanbanOrder);
		if (cards.length === 0) continue;
		sections.push({ board, cards: cards.map((todo) => ({ todo, rank: ++rank })) });
	}
	return sections;
}
