/** @file src/lib/server/ops/d1/__contract__/runner.test.ts */
// The runner ops (#247): each D1 version against production Hasura, same input, same JSON.
// Same setup as contract.test.ts. CONTRACT_WRITES=1 also files, moves, claims, comments on
// and drops one card on the test user's board on both sides (production has it for seconds).
import { describe, expect, it } from 'vitest';
import { serverRequest } from '$lib/graphql/server-client';
import { runnerOps, type RunnerOpName } from '$lib/server/runner';
import { runnerD1 } from '$lib/server/runner/d1';
import type { Op } from '../../op';
import { firstDiff, normalize } from './compare';
import { local } from './local';

const on = !!process.env.CONTRACT;
const hasura = { userId: null, db: serverRequest };

describe.skipIf(!on)('D1 runner ops equal Hasura', () => {
	const { sqlite, db } = on ? local() : ({} as ReturnType<typeof local>);
	const all = <T>(sql: string) => sqlite.prepare(sql).all() as T[];
	const ctx = { ...hasura, d1: db };

	/** Both answers for one call: its data, or its error status. */
	async function both(op: RunnerOpName, input: unknown) {
		const parsed = runnerOps[op].input.parse(input);
		const settle = (p: Promise<unknown>): Promise<{ data?: unknown; error?: unknown }> =>
			p.then(
				(data) => ({ data: normalize(data) }),
				(e) => ({ error: (e as { status?: number }).status ?? String(e) })
			);
		const d1Run = runnerD1[op] as Op['run'];
		return Promise.all([
			settle((runnerOps[op] as Op).run(hasura, parsed)),
			settle(d1Run(ctx, parsed))
		]);
	}

	async function diffs(cases: [RunnerOpName, unknown][]) {
		const failed: string[] = [];
		for (const [op, input] of cases) {
			// RUNNER_USAGE has no order_by: compare its rows as a set.
			const [h, l] = (await both(op, input)).map((r) =>
				op === 'usage' && Array.isArray(r.data)
					? { data: r.data.map((x) => JSON.stringify(x)).sort() }
					: r
			);
			const diff = firstDiff(h, l);
			if (diff) failed.push(`${op} ${JSON.stringify(input).slice(0, 120)}: ${diff}`);
		}
		return failed;
	}

	it('board for every connected repo; boards; pricing', { timeout: 120_000 }, async () => {
		const repos = all<{ r: string }>(
			`SELECT github_repo AS r FROM boards WHERE github_repo IS NOT NULL`
		);
		const cases: [RunnerOpName, unknown][] = repos.map(({ r }) => ['board', { repo: r }]);
		const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
		cases.push(
			['board', { repo: 'nobody/nothing' }],
			['boards', {}],
			['pricing', {}],
			['usage', { since }]
		);
		expect(await diffs(cases)).toEqual([]);
	});

	it('cards by every task path and by id', { timeout: 120_000 }, async () => {
		const paths = all<{ p: string }>(
			`SELECT DISTINCT task_file_path AS p FROM todos WHERE task_file_path IS NOT NULL LIMIT 500`
		).map((r) => r.p);
		const ids = all<{ id: string }>(`SELECT id FROM todos ORDER BY id LIMIT 500`).map((r) => r.id);
		expect(
			await diffs([
				['cards', { paths }],
				['cards', { ids }]
			])
		).toEqual([]);
	});

	it('comments and uploads of the cards that have them', { timeout: 120_000 }, async () => {
		const said = all<{ todo_id: string; user_id: string; content: string }>(
			`SELECT todo_id, user_id, content FROM comments GROUP BY todo_id LIMIT 40`
		);
		const shots = all<{ todo_id: string }>(`SELECT DISTINCT todo_id FROM uploads`);
		expect(
			await diffs([
				...said.map((c): [RunnerOpName, unknown] => ['comments', { todoId: c.todo_id }]),
				...said.map((c): [RunnerOpName, unknown] => [
					'comments',
					{ todoId: c.todo_id, userId: c.user_id, content: c.content }
				]),
				...shots.map((u): [RunnerOpName, unknown] => ['uploads', { todoId: u.todo_id }])
			])
		).toEqual([]);
	});

	it.skipIf(!process.env.CONTRACT_WRITES)(
		'createCard → updateCard → claim/release → comment → deleteCard',
		{ timeout: 60_000 },
		async () => {
			// The test user has no lists: add one, with the same id on both sides, for this test.
			const [{ board_id, user_id }] = all<{ board_id: string; user_id: string }>(
				`SELECT b.id AS board_id, b.user_id FROM boards b JOIN users u ON u.id = b.user_id
				 WHERE u.username = 'test' LIMIT 1`
			);
			const list_id = crypto.randomUUID();
			const newList = { id: list_id, board_id, name: 'Contract', sort_order: 99 };
			sqlite
				.prepare(`INSERT INTO lists (id, board_id, name, sort_order) VALUES (?, ?, ?, ?)`)
				.run(list_id, board_id, 'Contract', 99);
			await serverRequest(
				`mutation ($o: lists_insert_input!) { insert_lists_one(object: $o) { id } }`,
				{ o: newList }
			);
			const list = { list_id, user_id };
			const runs = [
				(op: RunnerOpName, input: unknown) =>
					(runnerOps[op] as Op).run(hasura, runnerOps[op].input.parse(input)),
				(op: RunnerOpName, input: unknown) =>
					(runnerD1[op] as Op['run'])(ctx, runnerOps[op].input.parse(input))
			];
			const path = `.claude/todo/999-contract${Date.now()}-TODO.md`;
			const card = { title: 'Contract', content: 'x', task_file_path: path, ...list };
			const steps = await Promise.all(
				runs.map(async (run) => {
					const { id } = (await run('createCard', card)) as { id: string };
					const out = [await run('cards', { paths: [path] })];
					out.push(await run('updateCard', { id, set: { content: 'y', github_issue_number: 7 } }));
					out.push(await run('claimCard', { id, machine: 'mac' }));
					out.push(await run('claimCard', { id, machine: 'karel' }));
					out.push(await run('releaseCard', { id, machine: 'mac' }));
					const c = (await run('createComment', {
						todoId: id,
						userId: list.user_id,
						content: 'hi'
					})) as {
						id: string;
					};
					out.push(await run('updateComment', { id: c.id, content: 'hi2' }));
					out.push(await run('comments', { todoId: id }));
					out.push(await run('deleteCard', { id }));
					return JSON.parse(JSON.stringify(out, (k, v) => (k === 'id' ? undefined : v)));
				})
			);
			sqlite.prepare(`DELETE FROM lists WHERE id = ?`).run(list_id);
			await serverRequest(`mutation ($id: uuid!) { delete_lists_by_pk(id: $id) { id } }`, {
				id: list_id
			});
			expect(normalize(steps[1])).toEqual(normalize(steps[0]));
		}
	);
});
