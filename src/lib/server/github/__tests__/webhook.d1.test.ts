/** @file src/lib/server/github/__tests__/webhook.d1.test.ts */
// The GitHub webhook on D1 (#263), through the route, on a real migrated SQLite. The Hasura
// client fails the test if anything reaches it.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { mockWebhookSignature } from '$lib/test-utils/github-mocks';

vi.mock('$env/dynamic/private', () => ({
	env: { GITHUB_WEBHOOK_SECRET: 'test-secret', DATA_BACKEND: 'd1' }
}));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: () => {
		throw new Error('Hasura called on D1');
	}
}));
const closeIssue = vi.fn();
vi.mock('$lib/server/github', () => ({
	getGithubToken: async () => 'token',
	githubRequest: async (path: string, _t: string, init?: RequestInit) => {
		if (init?.method === 'PATCH') return closeIssue(path);
		throw new Error('no file fetch on D1: the card is found by its task file path');
	}
}));

import { migratedSqlite, sqliteD1 } from '$lib/server/db/__tests__/sqliteD1';
import { POST } from '../../../../routes/api/github/webhook/+server';

const T1 = 'd0000000-0000-4000-8000-000000000001';
const T2 = 'd0000000-0000-4000-8000-000000000002';
const OLD = '2000-01-01T00:00:00.000Z';
const TODO_FILE = '.claude/todo/007-x-TODO.md';

let sqlite: DatabaseSync;

beforeEach(() => {
	closeIssue.mockReset();
	sqlite = migratedSqlite();
	sqlite.exec(`
		INSERT INTO users (id, username) VALUES ('me', 'me'), ('ann', 'ann');
		INSERT INTO user_secrets (user_id, name, value) VALUES ('ann', 'github', '{"username":"ann-gh"}');
		INSERT INTO boards (id, user_id, name, alias, github_repo, changed_at) VALUES
			('b1', 'me', 'B', 'b', 'o/r', '${OLD}'), ('b2', 'me', 'Fork', 'fork', 'o/r-fork', '${OLD}');
		INSERT INTO lists (id, board_id, name, sort_order) VALUES
			('l1', 'b1', 'TODO', 1), ('l2', 'b1', 'Review', 2), ('l3', 'b2', 'TODO', 1);
		INSERT INTO todos (id, user_id, list_id, title, alias, content, github_issue_id,
			github_issue_number, task_file_path) VALUES
			('${T1}', 'me', 'l1', 'First', 'first', 'Body', 1001, 7, '${TODO_FILE}'),
			('${T2}', 'me', 'l3', 'Fork card', 'fork-card', null, 2002, 7, null);
		INSERT INTO todo_assignees (todo_id, user_id) VALUES ('${T1}', 'me');`);
});

const rows = (q: string) => sqlite.prepare(q).all() as Record<string, unknown>[];
const one = (q: string) => rows(q)[0] ?? {};
const card = () => one(`SELECT * FROM todos WHERE id = '${T1}'`);
const stamped = (board = 'b1') =>
	one(`SELECT changed_at FROM boards WHERE id = '${board}'`).changed_at !== OLD;

async function deliver(event: string, payload: object) {
	const body = JSON.stringify(payload);
	const request = new Request('http://x/api/github/webhook', {
		method: 'POST',
		body,
		headers: {
			'x-github-event': event,
			'x-hub-signature-256': mockWebhookSignature(body, 'test-secret')
		}
	});
	const platform = { env: { DB: sqliteD1(sqlite) } };
	const res = await POST({ request, platform } as unknown as Parameters<typeof POST>[0]);
	expect(res.status).toBe(200);
}

const repository = { full_name: 'o/r' };
const issue = (action: string, extra: object = {}) =>
	deliver('issues', {
		action,
		repository,
		sender: { login: 'ann-gh' },
		issue: { id: 1001, number: 7, title: 'First', body: 'Body', closed_at: null, ...extra }
	});

describe('issue events on D1', () => {
	it('copies an edit, logs it as the mapped user and rings the assignee', async () => {
		await issue('edited', { title: 'Renamed' });
		expect(card()).toMatchObject({ title: 'Renamed', content: 'Body' });
		expect(one(`SELECT * FROM activity_logs`)).toMatchObject({
			user_id: 'ann',
			action_type: 'title_changed',
			old_value: 'First',
			new_value: 'Renamed'
		});
		expect(one(`SELECT * FROM notifications`)).toMatchObject({
			user_id: 'me',
			triggered_by_user_id: 'ann',
			type: 'edited'
		});
		expect(stamped()).toBe(true);
	});

	it('closes and reopens the card', async () => {
		await issue('closed', { closed_at: '2026-11-25T10:00:00Z' });
		expect(card().completed_at).toBe('2026-11-25T10:00:00.000Z');
		await issue('reopened');
		expect(card().completed_at).toBeNull();
		expect(rows(`SELECT action_type FROM activity_logs`).map((r) => r.action_type)).toEqual([
			'completed',
			'uncompleted'
		]);
	});

	it('syncs the priority label both ways and ignores other labels', async () => {
		await issue('labeled', { label: undefined }); // no label: nothing
		await deliver('issues', {
			action: 'labeled',
			repository,
			label: { name: 'Priority: High' },
			issue: { id: 1001, number: 7 }
		});
		expect(card().priority).toBe('high');
		await deliver('issues', {
			action: 'unlabeled',
			repository,
			label: { name: 'priority: high' },
			issue: { id: 1001, number: 7 }
		});
		expect(card().priority).toBeNull();
	});
});

const commentEvent = (action: string, body: string, login = 'stranger') =>
	deliver('issue_comment', {
		action,
		repository,
		issue: { id: 1001, number: 7 },
		comment: { id: 99, body, user: { login } }
	});

describe('comment events on D1', () => {
	it('copies a stranger’s comment once, as the owner, under their name', async () => {
		await commentEvent('created', 'Hello');
		await commentEvent('created', 'Hello'); // redelivery
		const [c] = rows(`SELECT * FROM comments`);
		expect(rows(`SELECT id FROM comments`)).toHaveLength(1);
		expect(c).toMatchObject({ user_id: 'me', github_comment_id: 99 });
		expect(c.content).toBe('**[stranger on GitHub]:**\n\nHello');
		// Nobody on the app wrote it, so the owner gets the bell.
		expect(one(`SELECT * FROM notifications`)).toMatchObject({
			user_id: 'me',
			triggered_by_user_id: null,
			related_comment_id: c.id
		});
		expect(stamped()).toBe(true);
	});

	it('links the card’s own comment coming back instead of copying it', async () => {
		sqlite.exec(`INSERT INTO comments (id, todo_id, user_id, content)
			VALUES ('c1', '${T1}', 'me', '## Results')`);
		await commentEvent('created', '## Results', 'ann-gh');
		expect(rows(`SELECT id, github_comment_id FROM comments`)).toEqual([
			{ id: 'c1', github_comment_id: 99 }
		]);
	});

	it('follows an edit and a delete on GitHub', async () => {
		await commentEvent('created', 'Hello', 'ann-gh');
		await commentEvent('edited', 'Hello again', 'ann-gh');
		expect(one(`SELECT content FROM comments`).content).toBe('Hello again');
		await commentEvent('deleted', 'Hello again', 'ann-gh');
		expect(rows(`SELECT id FROM comments`)).toHaveLength(0);
		expect(rows(`SELECT action_type FROM activity_logs`).map((r) => r.action_type)).toEqual([
			'commented',
			'comment_edited',
			'comment_deleted'
		]);
	});
});

const commit = (extra: object = {}) => ({
	id: 'abcdef1234567',
	url: 'https://x/c',
	message: 'fix: the thing (#7)',
	author: { name: 'Ann', username: 'ann-gh' },
	added: [],
	removed: [],
	modified: ['a.ts'],
	...extra
});
const push = (c: object, ref = 'refs/heads/main') =>
	deliver('push', { ref, repository, commits: [c] });

describe('push events on D1', () => {
	it('logs a commit on the exact repo’s card, once', async () => {
		await push(commit());
		await push(commit()); // redelivery
		await push(commit({ id: 'other' }), 'refs/heads/feature');
		expect(rows(`SELECT todo_id, user_id FROM activity_logs`)).toEqual([
			{ todo_id: T1, user_id: 'ann' }
		]);
		expect(stamped('b2')).toBe(false); // o/r-fork is not o/r
	});

	const done = commit({
		message: 'docs(todo): 007 done',
		removed: [TODO_FILE],
		added: ['.claude/todo/007-x-DONE.md']
	});

	it('moves a DONE card to Review, says so and closes the issue', async () => {
		await push(done);
		expect(card().list_id).toBe('l2');
		expect(one(`SELECT content FROM comments`).content).toMatch(/^✅ \*\*Task complete\*\*/);
		expect(closeIssue).toHaveBeenCalledWith('/repos/o/r/issues/7');
		expect(stamped()).toBe(true);
	});

	it('leaves a card the runner ran to the runner', async () => {
		sqlite.exec(`INSERT INTO comments (id, todo_id, user_id, content)
			VALUES ('s1', '${T1}', 'me', '■ Finished on mac in 3m')`);
		await push(done);
		expect(card().list_id).toBe('l1');
		expect(closeIssue).not.toHaveBeenCalled();
	});
});
