/** @file src/lib/server/runner/d1/cards.ts */
// The runner's boards and cards on D1 (#247). A repo matches `boards.github_repo` exactly
// (ignoring case) — on Hasura it was a substring of the JSON, so `o/app` also found
// `o/app-2`. createCard sets the alias the Postgres trigger `set_todo_alias` did.
import { and, asc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import { aliasBase, nextFree, prefixRange } from '$lib/server/db/rules';
import { boards as boardTable, lists, todos } from '$lib/server/db/schema';
import { OpError } from '$lib/server/ops/op';
import { githubJson, githubRepo } from '$lib/server/ops/d1/boardRows';
import { inList, iso, sameText } from '$lib/server/ops/d1/sql';
import type { RunnerD1Run } from './types';

export const board: RunnerD1Run<'board'> = async ({ d1 }, { repo }) => {
	const row = await d1.query.boards.findFirst({
		where: sameText(boardTable.github_repo, repo),
		columns: { id: true, user_id: true },
		with: { lists: { columns: { id: true, name: true }, orderBy: [asc(lists.sort_order)] } }
	});
	return row ?? null;
};

export const boards: RunnerD1Run<'boards'> = async ({ d1 }) => {
	const { id, name, github_repo, client_id, archived_at } = boardTable;
	const rows = await d1
		.select({ id, name, github_repo, client_id, archived_at })
		.from(boardTable)
		.where(isNotNull(github_repo))
		.orderBy(sql`${name} collate nocase`);
	return rows.map(({ github_repo, ...b }) => ({ ...b, github: githubJson(github_repo) }));
};

export const setBoardGithub: RunnerD1Run<'setBoardGithub'> = async ({ d1 }, { id, github }) => {
	let repo: string | null;
	try {
		repo = githubRepo(github);
	} catch {
		throw new OpError(400, 'github is not JSON');
	}
	const [row] = await d1
		.update(boardTable)
		.set({ github_repo: repo })
		.where(eq(boardTable.id, id))
		.returning({ id: boardTable.id });
	if (!row) throw new OpError(404, 'Board not found');
	return row;
};

export const cards: RunnerD1Run<'cards'> = async ({ d1 }, { ids, paths }) => {
	const rows = await d1
		.select({ id: todos.id, task_file_path: todos.task_file_path, listName: lists.name })
		.from(todos)
		.leftJoin(lists, eq(lists.id, todos.list_id))
		.where(ids ? inList(todos.id, ids) : inList(todos.task_file_path, paths ?? []))
		.orderBy(asc(todos.created_at), asc(todos.id));
	return rows.map(({ listName, ...card }) => ({
		...card,
		list: listName === null ? null : { name: listName }
	}));
};

/** `generate_unique_alias_for_user_todo`: the title's alias, numbered when this user has it. */
export async function todoAlias(d1: D1, userId: string, title: string) {
	const base = aliasBase(title, 'todo');
	const [from, to] = prefixRange(base);
	const taken = await d1
		.select({ alias: todos.alias })
		.from(todos)
		.where(
			and(eq(todos.user_id, userId), sql`${todos.alias} >= ${from}`, sql`${todos.alias} < ${to}`)
		);
	return nextFree(
		base,
		taken.map((r) => r.alias)
	);
}

export const createCard: RunnerD1Run<'createCard'> = async ({ d1 }, card) => {
	const id = crypto.randomUUID();
	const alias = await todoAlias(d1, card.user_id, card.title);
	await d1.insert(todos).values({ ...card, id, alias });
	return { id };
};

export const updateCard: RunnerD1Run<'updateCard'> = async ({ d1 }, { id, set }) => {
	const { github_synced_at: synced, ...rest } = set;
	const values = { ...rest, ...(synced !== undefined && { github_synced_at: iso(synced) }) };
	// `updated_at` comes from the schema's $onUpdateFn, as the Postgres trigger did.
	const result = await d1.update(todos).set(values).where(eq(todos.id, id));
	return { updated: result.meta.changes > 0 };
};

export const deleteCard: RunnerD1Run<'deleteCard'> = async ({ d1 }, { id }) => {
	const result = await d1.delete(todos).where(eq(todos.id, id));
	return { deleted: result.meta.changes > 0 };
};

export const claimCard: RunnerD1Run<'claimCard'> = async ({ d1 }, { id, machine }) => {
	const free = or(isNull(todos.agent_machine), sameText(todos.agent_machine, machine));
	const result = await d1
		.update(todos)
		.set({ agent_machine: machine })
		.where(and(eq(todos.id, id), free));
	return { claimed: result.meta.changes === 1 };
};

export const releaseCard: RunnerD1Run<'releaseCard'> = async ({ d1 }, { id, machine }) => {
	const result = await d1
		.update(todos)
		.set({ agent_machine: null })
		.where(and(eq(todos.id, id), sameText(todos.agent_machine, machine)));
	return { released: result.meta.changes === 1 };
};
