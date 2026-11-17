/** @file src/lib/server/__tests__/unqueue.d1.test.ts */
// A card leaving the agent list on D1 (#258): the task file path and the card comment
// are written to D1, the comment through the createComment op.
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
vi.mock('$lib/server/github', () => ({
	getGithubToken: async () => 'token',
	githubRequest: async () => ({ sha: 'abc' })
}));
vi.mock('$lib/server/taskdir', () => ({ commitTree: async () => {} }));

import { d1 } from '$lib/server/db';
import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { unqueue } from '../unqueue';

const T1 = 'd0000000-0000-4000-8000-000000000001';

describe('unqueue on D1', () => {
	it('points the card at the draft and says so in a comment', async () => {
		const sqlite = migratedSqlite();
		sqlite.exec(`
			INSERT INTO users (id, username) VALUES ('me', 'me');
			INSERT INTO boards (id, user_id, name, alias) VALUES ('b1', 'me', 'B', 'b');
			INSERT INTO board_members (id, board_id, user_id, role) VALUES ('m1', 'b1', 'me', 'owner');
			INSERT INTO lists (id, board_id, name, sort_order) VALUES ('l1', 'b1', 'L', 1);
			INSERT INTO todos (id, user_id, list_id, title, alias, task_file_path, github_issue_number)
				VALUES ('${T1}', 'me', 'l1', 'T', 't', '.claude/todo/7-x-TODO.md', 7);`);
		const ctx = { userId: 'me', db: async () => ({}) as never, d1: d1(sqliteD1(sqlite)) };
		const todo = { id: T1, task_file_path: '.claude/todo/7-x-TODO.md', github_issue_number: 7 };

		const res = await unqueue(ctx, todo, { owner: 'o', repo: 'r' });

		expect(await res.json()).toEqual({ success: true, path: '.claude/todo/7-x.md' });
		const row = (q: string) => sqlite.prepare(q).get() as Record<string, unknown>;
		expect(row(`SELECT task_file_path FROM todos`).task_file_path).toBe('.claude/todo/7-x.md');
		expect(row(`SELECT content FROM comments`).content).toBe(
			'Task file back to draft: .claude/todo/7-x.md (#7)'
		);
	});
});
