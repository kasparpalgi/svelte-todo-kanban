/** @file src/lib/utils/filterBoards.ts */

/** Case-insensitive match of the query against board name, alias and owner username. */
export function filterBoards<
	T extends {
		name?: string | null;
		alias?: string | null;
		user?: { username?: string | null } | null;
	}
>(boards: T[], query: string): T[] {
	const q = query.trim().toLowerCase();
	if (!q) return boards;
	return boards.filter((b) =>
		[b.name, b.alias, b.user?.username].some((v) => v?.toLowerCase().includes(q))
	);
}
