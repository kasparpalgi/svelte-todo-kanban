/** @file src/lib/server/github/__tests__/routes.d1.test.ts */
// The GitHub routes besides the webhook on D1 (#264), through the route handlers, on a real
// migrated SQLite. The Hasura client fails the test if anything reaches it.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';

vi.mock('$env/dynamic/private', () => ({
	env: { DATA_BACKEND: 'd1', GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'sec' }
}));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
vi.mock('$lib/utils/crypto', () => ({ encryptToken: (s: string) => `enc:${s}` }));
const githubRequest = vi.fn();
vi.mock('$lib/server/github', () => ({
	GITHUB_USER_AGENT: 'test',
	getGithubToken: async () => 'token',
	githubRequest: (...args: unknown[]) => githubRequest(...args)
}));

import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { GET as callback } from '../../../../routes/api/github/callback/+server';
import { POST as createComment } from '../../../../routes/api/github/create-comment/+server';
import { POST as createIssue } from '../../../../routes/api/github/create-issue/+server';
import { POST as importIssues } from '../../../../routes/api/github/import-issues/+server';
import { PATCH as updateIssue } from '../../../../routes/api/github/update-issue/+server';
import { POST as updateTaskFile } from '../../../../routes/api/github/update-task-file/+server';
import { POST as writeDraftFile } from '../../../../routes/api/github/write-draft-file/+server';
import { POST as writeTaskFile } from '../../../../routes/api/github/write-task-file/+server';

const B1 = 'b0000000-0000-4000-8000-000000000001';
const L1 = 'c0000000-0000-4000-8000-000000000001';
const L2 = 'c0000000-0000-4000-8000-000000000002';
const T1 = 'd0000000-0000-4000-8000-000000000001';
const C1 = 'e0000000-0000-4000-8000-000000000001';
const OLD = '2000-01-01T00:00:00.000Z';

let sqlite: DatabaseSync;

beforeEach(() => {
	githubRequest.mockReset();
	sqlite = migratedSqlite();
	sqlite.exec(`
		INSERT INTO users (id, username, email) VALUES ('me', 'me', 'me@example.com'),
			('ann', 'ann', 'ann@example.com'), ('eve', 'eve', 'eve@example.com');
		INSERT INTO boards (id, user_id, name, alias, github_repo, settings, changed_at) VALUES
			('${B1}', 'me', 'Mine', 'mine', 'o/r', '{"agent_list_id":"${L1}"}', '${OLD}');
		INSERT INTO board_members (id, board_id, user_id, role) VALUES
			('m1', '${B1}', 'me', 'owner'), ('m2', '${B1}', 'ann', 'viewer');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES
			('${L1}', '${B1}', 'Agent', 1), ('${L2}', '${B1}', 'Backlog', 2);
		INSERT INTO todos (id, user_id, list_id, title, alias, content, github_issue_number) VALUES
			('${T1}', 'me', '${L1}', 'First card', 'first-card', 'Body', 7);
		INSERT INTO comments (id, todo_id, user_id, content) VALUES ('${C1}', '${T1}', 'me', 'Hello');`);
});

const rows = (q: string) => sqlite.prepare(q).all() as Record<string, any>[];
const one = (q: string) => rows(q)[0] ?? {};
const card = () => one(`SELECT * FROM todos WHERE id = '${T1}'`);
const stamped = () => one(`SELECT changed_at FROM boards WHERE id = '${B1}'`).changed_at !== OLD;

/** A route event for `user`, on the migrated database. */
function event(user: string | null, body: object = {}, extra: object = {}) {
	return {
		request: new Request('http://x/api/github', { method: 'POST', body: JSON.stringify(body) }),
		locals: {
			auth: async () => (user ? { user: { id: user, email: `${user}@example.com` } } : null)
		},
		platform: { env: { DB: sqliteD1(sqlite) } },
		...extra
	} as never;
}

const notFound = () => new Error('GitHub API error (404): Not Found');

describe('callback', () => {
	it('keeps the token in user_secrets under github', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: string) =>
				Response.json(url.includes('access_token') ? { access_token: 'gho_1' } : { login: 'me-gh' })
			)
		);
		const url = new URL('http://x/api/github/callback?code=c&state=me');
		const res = await callback({ url, platform: { env: { DB: sqliteD1(sqlite) } } } as never).catch(
			(r) => r
		);
		expect(res.location).toBe('/settings?connected=github');
		const secret = one(`SELECT value FROM user_secrets WHERE user_id = 'me' AND name = 'github'`);
		expect(JSON.parse(secret.value)).toMatchObject({ encrypted: 'enc:gho_1', username: 'me-gh' });
		vi.unstubAllGlobals();
	});
});

describe('issues and comments', () => {
	it('create-issue writes the issue ids onto the card and moves changed_at', async () => {
		githubRequest.mockResolvedValue({ id: 99, number: 12, html_url: 'https://gh/12' });
		const res = await createIssue(
			event('me', { todoId: T1, title: 'First card', priority: 'high' })
		);
		expect(await res.json()).toMatchObject({ success: true, issueNumber: 12 });
		expect(githubRequest.mock.calls[0][0]).toBe('/repos/o/r/issues');
		expect(card()).toMatchObject({
			github_issue_number: 12,
			github_issue_id: 99,
			github_url: 'https://gh/12'
		});
		expect(stamped()).toBe(true);
	});

	it('create-issue refuses a card the caller cannot see', async () => {
		await expect(createIssue(event('eve', { todoId: T1, title: 'x' }))).rejects.toMatchObject({
			status: 500
		});
		expect(githubRequest).not.toHaveBeenCalled();
	});

	it('update-issue stamps github_synced_at, and not for a viewer', async () => {
		githubRequest.mockResolvedValue({ number: 7, html_url: 'u', state: 'closed' });
		const body = { todoId: T1, githubIssueNumber: 7, owner: 'o', repo: 'r', state: 'closed' };
		await expect(updateIssue(event('ann', body))).rejects.toMatchObject({ status: 500 });
		expect(card().github_synced_at).toBeNull();
		const res = await updateIssue(event('me', body));
		expect(await res.json()).toMatchObject({ success: true, state: 'closed' });
		expect(card().github_synced_at).not.toBeNull();
		expect(stamped()).toBe(true);
	});

	it('create-comment writes the GitHub id onto the author’s comment only', async () => {
		githubRequest.mockResolvedValue({ id: 555, html_url: 'https://gh/c' });
		const body = {
			commentId: C1,
			todoId: T1,
			githubIssueNumber: 7,
			owner: 'o',
			repo: 'r',
			body: 'Hello'
		};
		await expect(createComment(event('ann', body))).rejects.toBeDefined();
		expect(one(`SELECT github_comment_id g FROM comments`).g).toBeNull();
		await createComment(event('me', body));
		expect(one(`SELECT github_comment_id g FROM comments`).g).toBe(555);
		expect(stamped()).toBe(true);
	});
});

describe('import-issues', () => {
	const issues = Array.from({ length: 12 }, (_, i) => ({
		id: 1000 + i,
		number: 100 + i,
		title: i < 3 ? 'Same title' : `Issue ${i}`,
		body: i === 0 ? 'Text' : null,
		html_url: `https://gh/${100 + i}`,
		state: i === 4 ? 'closed' : 'open',
		closed_at: i === 4 ? '2024-05-01T10:00:00Z' : null,
		labels: i === 1 ? [{ name: 'priority: high' }] : [],
		milestone: i === 2 ? { due_on: '2024-06-01T00:00:00Z' } : undefined
	}));

	it('inserts the open issues as cards with their own aliases, in one stamped batch', async () => {
		githubRequest.mockResolvedValue([...issues, { ...issues[0], id: 1, pull_request: {} }]);
		const res = await importIssues(event('me', { boardId: B1, targetListId: L2 }));
		expect(await res.json()).toMatchObject({ success: true, imported: 12, total: 12 });
		const made = rows(`SELECT * FROM todos WHERE list_id = '${L2}' ORDER BY sort_order`);
		expect(made).toHaveLength(12);
		expect(made.slice(0, 3).map((c) => c.alias)).toEqual([
			'same-title',
			'same-title1',
			'same-title2'
		]);
		expect(made[1]).toMatchObject({ priority: 'high', github_issue_number: 101, user_id: 'me' });
		expect(made[2].due_on).toBe('2024-06-01T00:00:00.000Z');
		expect(made[4].completed_at).toBe('2024-05-01T10:00:00.000Z');
		expect(stamped()).toBe(true);
	});

	it('refuses a viewer, and a list on another board', async () => {
		githubRequest.mockResolvedValue(issues);
		await expect(
			importIssues(event('ann', { boardId: B1, targetListId: L2 }))
		).rejects.toBeDefined();
		sqlite.exec(`
			INSERT INTO boards (id, user_id, name, alias) VALUES ('b9', 'me', 'Other', 'other');
			INSERT INTO lists (id, board_id, name, sort_order) VALUES
				('c0000000-0000-4000-8000-000000000009', 'b9', 'Elsewhere', 1);`);
		await expect(
			importIssues(
				event('me', { boardId: B1, targetListId: 'c0000000-0000-4000-8000-000000000009' })
			)
		).rejects.toBeDefined();
		expect(rows(`SELECT id FROM todos`)).toHaveLength(1);
	});
});

describe('task files', () => {
	const repoWithTodoDir = () =>
		githubRequest.mockImplementation(async (path: string, _t: string, opts?: RequestInit) => {
			if (String(path).endsWith('/contents/.claude/todo')) return [];
			if (opts?.method === 'PUT') return {};
			throw notFound();
		});

	it('write-task-file queues the card, saves the path and comments on the card', async () => {
		repoWithTodoDir();
		const res = await writeTaskFile(event('me', { todoId: T1 }));
		expect(await res.json()).toEqual({ success: true, path: '.claude/todo/007-firstCard-TODO.md' });
		expect(card().task_file_path).toBe('.claude/todo/007-firstCard-TODO.md');
		expect(one(`SELECT content FROM comments WHERE id != '${C1}'`).content).toContain(
			'Task file ready'
		);
		expect(stamped()).toBe(true);
	});

	it('write-task-file takes a card out of the queue when it leaves the agent list', async () => {
		sqlite.exec(`UPDATE todos SET list_id = '${L2}', task_file_path = '.claude/todo/7-x-TODO.md'`);
		githubRequest.mockImplementation(async (path: string, _t: string, opts?: RequestInit) => {
			if (String(path).endsWith('/contents/.claude/todo/7-x-TODO.md')) return { sha: 's' };
			if (String(path).endsWith('/kasparpalgi/x') || !opts?.method)
				return { default_branch: 'main', object: { sha: 'h' }, tree: { sha: 't' }, sha: 's' };
			return { sha: 'n' };
		});
		const res = await writeTaskFile(event('me', { todoId: T1 }));
		expect(await res.json()).toMatchObject({ success: true, path: '.claude/todo/7-x.md' });
		expect(card().task_file_path).toBe('.claude/todo/7-x.md');
	});

	it('write-draft-file saves the draft path on the card', async () => {
		repoWithTodoDir();
		const res = await writeDraftFile(event('me', { todoId: T1 }));
		expect(await res.json()).toMatchObject({
			success: true,
			path: '.claude/todo/007-firstCard.md'
		});
		expect(card().task_file_path).toBe('.claude/todo/007-firstCard.md');
	});

	it('update-task-file rewrites the file with the card’s comments, and reads nothing it may not', async () => {
		sqlite.exec(`UPDATE todos SET task_file_path = '.claude/todo/7-x-TODO.md'`);
		githubRequest.mockImplementation(async (_p: string, _t: string, opts?: RequestInit) =>
			opts?.method === 'PUT' ? {} : { sha: 'abc' }
		);
		const res = await updateTaskFile(event('me', { todoId: T1 }));
		expect(await res.json()).toEqual({ success: true, path: '.claude/todo/7-x-TODO.md' });
		const put = githubRequest.mock.calls.find(([, , o]) => o?.method === 'PUT');
		const text = Buffer.from(JSON.parse(put![2].body).content, 'base64').toString('utf8');
		expect(text).toContain('First card');
		expect(text).toContain('Hello');

		githubRequest.mockClear();
		const denied = await updateTaskFile(event('eve', { todoId: T1 }));
		expect(await denied.json()).toEqual({ skipped: 'no task file path' });
		expect(githubRequest).not.toHaveBeenCalled();
	});
});
