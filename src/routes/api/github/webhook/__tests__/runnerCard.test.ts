/** @file src/routes/api/github/webhook/__tests__/runnerCard.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockWebhookSignature } from '$lib/test-utils/github-mocks';

const SECRET = 'test-secret';
const CARD = '32e35cd5-3cae-4585-a67e-7157ccb12172';
const RESULTS = '## Results\n\n**Summary** — once.';

type Vars = {
	where?: { github_comment_id?: unknown; content?: { _eq?: string; _regex?: string } };
};
const db = vi.hoisted(() => ({ calls: [] as Array<{ op: string; vars: Vars }>, ran: false }));

vi.mock('$env/dynamic/private', () => ({ env: { GITHUB_WEBHOOK_SECRET: 'test-secret' } }));
vi.mock('$lib/server/github', () => ({
	getGithubToken: async () => 'token',
	githubRequest: async () => ({
		content: Buffer.from(`_From Kanban card \`${CARD}\`, moved to the agent list._`).toString(
			'base64'
		)
	})
}));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: async (doc: unknown, vars: Vars) => {
		const op = /(?:query|mutation)\s+(\w+)/.exec(String(doc))?.[1] ?? '?';
		db.calls.push({ op, vars });
		const lists = [
			{ id: 'todo', name: 'TODO' },
			{ id: 'review', name: 'Review' }
		];
		const card = { id: CARD, list_id: 'todo', list: { board: { user_id: 'u', lists } } };
		if (op === 'GetTodoByGithubIssue') return { todos: [card] };
		if (op === 'GetTodoById') return { todos_by_pk: { ...card, github_issue_number: 80 } };
		if (op === 'GetBoardByRepo') return { boards: [{ id: 'b', user_id: 'u', lists }] };
		if (op === 'GetCommentByGithubId') return { comments: [] };
		if (op === 'GetComments') {
			const twin = vars.where?.github_comment_id && vars.where.content?._eq === RESULTS;
			const status = vars.where?.content?._regex && db.ran;
			return { comments: twin || status ? [{ id: 'c1' }] : [] };
		}
		return { users: [{ id: 'u' }], insert_comments: { returning: [{ id: 'new' }] } };
	}
}));

const { POST } = await import('../+server');

async function deliver(event: string, payload: object) {
	const body = JSON.stringify(payload);
	const request = new Request('http://x/api/github/webhook', {
		method: 'POST',
		body,
		headers: { 'x-github-event': event, 'x-hub-signature-256': mockWebhookSignature(body, SECRET) }
	});
	await POST({ request } as unknown as Parameters<typeof POST>[0]);
	return db.calls.map((c) => c.op);
}

const comment = (body: string) => ({
	action: 'created',
	issue: { id: 1, number: 80 },
	comment: { id: 99, body, user: { login: 'kasparpalgi' } }
});

const push = {
	ref: 'refs/heads/main',
	repository: { full_name: 'o/r' },
	commits: [
		{
			id: 'abcdef1234567',
			url: 'https://x/c',
			message: 'fix: once',
			author: { name: 'k' },
			removed: ['doc/todo/080-comments2x-TODO.md'],
			added: ['doc/todo/080-comments2x-DONE.md'],
			modified: []
		}
	]
};

describe('webhook and the runner on one card (svelte-hasura-boilerplate#80)', () => {
	beforeEach(() => {
		db.calls = [];
		db.ran = false;
	});

	it('links the issue comment the card already holds instead of copying it', async () => {
		const ops = await deliver('issue_comment', comment(RESULTS));
		expect(ops).toContain('UpdateComment');
		expect(ops).not.toContain('CreateComment');
		const link = db.calls.find((c) => c.op === 'UpdateComment')!.vars;
		expect(link).toMatchObject({ where: { id: { _eq: 'c1' } }, _set: { github_comment_id: 99 } });
	});

	it('still copies a comment that was written on GitHub', async () => {
		const ops = await deliver('issue_comment', comment('Looks good from here.'));
		expect(ops).toContain('CreateComment');
		expect(ops).not.toContain('UpdateComment');
	});

	it('leaves a card the runner ran to the runner', async () => {
		db.ran = true;
		const ops = await deliver('push', push);
		expect(ops).not.toContain('UpdateTodos');
		expect(ops).not.toContain('CreateComment');
	});

	it('closes a card no runner touched, as before', async () => {
		const ops = await deliver('push', push);
		expect(ops).toContain('UpdateTodos');
		expect(ops).toContain('CreateComment');
	});
});
