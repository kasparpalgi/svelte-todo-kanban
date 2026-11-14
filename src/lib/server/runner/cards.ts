/** @file src/lib/server/runner/cards.ts */
// The runner's boards and cards (#231): find a repo's board, file, claim, move and drop
// the cards its task files stand for. Admin rights: the runner token is the caller.
import { z } from 'zod';
import {
	RUNNER_BOARD,
	RUNNER_BOARDS,
	RUNNER_CARDS,
	RUNNER_CREATE_CARD,
	RUNNER_DELETE_CARD,
	RUNNER_SET_BOARD_GITHUB,
	RUNNER_UPDATE_CARDS
} from '$lib/graphql/documents';
import { defineOp, OpError } from '$lib/server/ops/op';

const id = z.guid();
const path = z.string().min(1).max(500);
const machine = z.string().min(1).max(200);

/** The board whose `github` names this repo, with its lists; null when none does. */
export const board = defineOp({
	auth: 'public',
	input: z.object({ repo: z.string().min(1).max(200) }),
	async run(ctx, { repo }) {
		const { boards } = await ctx.db(RUNNER_BOARD, { repo: `%${repo}%` });
		return boards.at(0) ?? null;
	}
});

/** Every board connected to a repo, archived ones too (offboard needs those). */
export const boards = defineOp({
	auth: 'public',
	input: z.object({}),
	async run(ctx) {
		return (await ctx.db(RUNNER_BOARDS, {})).boards;
	}
});

export const setBoardGithub = defineOp({
	auth: 'public',
	input: z.object({ id, github: z.string().min(2).max(5_000) }),
	async run(ctx, input) {
		const data = await ctx.db(RUNNER_SET_BOARD_GITHUB, input);
		if (!data.update_boards_by_pk) throw new OpError(404, 'Board not found');
		return data.update_boards_by_pk;
	}
});

/** Cards by id or by task file path, oldest first: the first one filed is the lock. */
export const cards = defineOp({
	auth: 'public',
	input: z
		.object({ ids: z.array(id).max(500), paths: z.array(path).max(500) })
		.partial()
		.refine((i) => !i.ids !== !i.paths, 'ids or paths'),
	async run(ctx, { ids, paths }) {
		const where = ids ? { id: { _in: ids } } : { task_file_path: { _in: paths } };
		return (await ctx.db(RUNNER_CARDS, { where })).todos;
	}
});

export const createCard = defineOp({
	auth: 'public',
	input: z.object({
		title: z.string().min(1).max(500),
		content: z.string().max(1_000_000),
		list_id: id,
		user_id: id,
		task_file_path: path
	}),
	async run(ctx, o) {
		const data = await ctx.db(RUNNER_CREATE_CARD, { o });
		if (!data.insert_todos_one) throw new Error('insert_todos_one returned no row');
		return data.insert_todos_one;
	}
});

export const updateCard = defineOp({
	auth: 'public',
	input: z.object({
		id,
		set: z
			.object({
				list_id: id,
				task_file_path: path,
				content: z.string().max(1_000_000),
				github_issue_number: z.number().int(),
				github_issue_id: z.number().int(),
				github_url: z.string().max(500),
				github_synced_at: z.string().max(40)
			})
			.partial()
			.strict()
	}),
	async run(ctx, { id, set }) {
		const data = await ctx.db(RUNNER_UPDATE_CARDS, { where: { id: { _eq: id } }, set });
		return { updated: (data.update_todos?.affected_rows ?? 0) > 0 };
	}
});

export const deleteCard = defineOp({
	auth: 'public',
	input: z.object({ id }),
	async run(ctx, { id }) {
		return { deleted: !!(await ctx.db(RUNNER_DELETE_CARD, { id })).delete_todos_by_pk };
	}
});

/** Take the card for `machine` unless another machine holds it. */
export const claimCard = defineOp({
	auth: 'public',
	input: z.object({ id, machine }),
	async run(ctx, { id, machine }) {
		const where = {
			id: { _eq: id },
			_or: [{ agent_machine: { _is_null: true } }, { agent_machine: { _ilike: machine } }]
		};
		const data = await ctx.db(RUNNER_UPDATE_CARDS, { where, set: { agent_machine: machine } });
		return { claimed: data.update_todos?.affected_rows === 1 };
	}
});

/** Put the card back on Auto, if `machine` holds it. */
export const releaseCard = defineOp({
	auth: 'public',
	input: z.object({ id, machine }),
	async run(ctx, { id, machine }) {
		const where = { id: { _eq: id }, agent_machine: { _ilike: machine } };
		const data = await ctx.db(RUNNER_UPDATE_CARDS, { where, set: { agent_machine: null } });
		return { released: data.update_todos?.affected_rows === 1 };
	}
});
