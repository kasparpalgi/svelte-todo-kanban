/** @file src/routes/api/github/__tests__/write-task-file.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

const githubRequest = vi.fn();
const serverRequest = vi.fn();

vi.mock('$lib/server/github', () => ({
	getGithubToken: async () => 'gh-token',
	githubRequest: (...args: unknown[]) => githubRequest(...args)
}));
vi.mock('$lib/graphql/server-client', () => ({
	serverRequest: (...args: unknown[]) => serverRequest(...args)
}));
vi.mock('$lib/graphql/documents', () => ({ CREATE_COMMENT: 'CREATE_COMMENT' }));

const { POST } = await import('../write-task-file/+server');

const LIST_ID = 'list-1';

const CARD = {
	id: 'card-1',
	title: "Drag'n'drop crap",
	content: 'Refactor it properly.',
	agent_model: 'opus-5',
	agent_effort: 'high',
	github_issue_number: 163,
	task_file_path: null as string | null,
	list: {
		id: LIST_ID,
		board: {
			id: 'board-1',
			github: '{"owner":"kasparpalgi","repo":"svelte-todo-kanban"}',
			settings: { agent_list_id: LIST_ID }
		}
	}
};

function call(card: Partial<typeof CARD>) {
	serverRequest.mockImplementation(async (query: string) => {
		if (String(query).includes('GetTodoForTaskFile')) {
			return { todos_by_pk: { ...CARD, ...card } };
		}
		return {};
	});
	return POST({
		locals: { auth: async () => ({ user: { id: 'user-1' } }) },
		request: { json: async () => ({ todoId: 'card-1' }) }
	} as never);
}

/** The PUT that writes a task file, decoded back to markdown. */
function writtenFile() {
	const put = githubRequest.mock.calls.find(
		([, , opts]) => opts?.method === 'PUT' && String(opts.body).includes('from Kanban')
	);
	if (!put) return null;
	const [path, , opts] = put;
	return {
		path: String(path).replace('/repos/kasparpalgi/svelte-todo-kanban/contents/', ''),
		body: Buffer.from(JSON.parse(String(opts.body)).content, 'base64').toString('utf-8')
	};
}

/** GitHub's 404 shape, which the endpoint detects by the "(404)" in the message. */
function notFound() {
	return Object.assign(new Error('GitHub API error (404): Not Found'));
}

beforeEach(() => {
	githubRequest.mockReset();
	serverRequest.mockReset();
});

describe('POST /api/github/write-task-file', () => {
	it('writes a fresh file when the card points at one that was deleted', async () => {
		// The card still names 160-…-TODO.md, but that file is gone from the repo.
		githubRequest.mockImplementation(async (path: string, _t: string, opts?: RequestInit) => {
			if (String(path).endsWith('/160-dragNDropCrap-TODO.md')) throw notFound();
			if (String(path).endsWith('/contents/.claude/todo'))
				return [{ name: '162-paneAnswersLost.md' }];
			if (opts?.method === 'PUT') return {};
			throw notFound();
		});

		const res = await call({ task_file_path: '.claude/todo/160-dragNDropCrap-TODO.md' });

		expect(await res.json()).toEqual({
			success: true,
			path: '.claude/todo/163-dragNDropCrap-TODO.md'
		});
		expect(writtenFile()?.path).toBe('.claude/todo/163-dragNDropCrap-TODO.md');
	});

	it("carries the card's model dropdown into the Run with line", async () => {
		githubRequest.mockImplementation(async (path: string, _t: string, opts?: RequestInit) => {
			if (String(path).endsWith('/contents/.claude/todo')) return [{ name: '162-x.md' }];
			if (opts?.method === 'PUT') return {};
			throw notFound();
		});

		await call({ task_file_path: null });

		expect(writtenFile()?.body).toContain('> Run with: Opus 5 / high');
	});

	it('skips when the file the card names is really still there', async () => {
		githubRequest.mockResolvedValue({ content: '', sha: 'abc' });

		const res = await call({ task_file_path: '.claude/todo/163-dragNDropCrap-TODO.md' });

		expect(await res.json()).toEqual({
			skipped: 'already a TODO file',
			path: '.claude/todo/163-dragNDropCrap-TODO.md'
		});
	});

	it('renames a live draft to -TODO.md', async () => {
		githubRequest.mockResolvedValue({ content: 'ZHJhZnQ=', sha: 'abc' });

		const res = await call({ task_file_path: '.claude/todo/163-dragNDropCrap.md' });

		expect(await res.json()).toEqual({
			success: true,
			path: '.claude/todo/163-dragNDropCrap-TODO.md'
		});
	});

	it('does nothing when the list is not the board agent list', async () => {
		const res = await call({
			list: { ...CARD.list, board: { ...CARD.list.board, settings: { agent_list_id: 'other' } } }
		});

		expect(await res.json()).toEqual({ skipped: 'not the agent list' });
		expect(githubRequest).not.toHaveBeenCalled();
	});
});

// The Run with line comes from these columns; an endpoint that builds a task file
// without selecting them silently falls back to the default tier.
describe.each(['write-task-file', 'write-draft-file', 'update-task-file'])(
	'%s query',
	(endpoint) => {
		it('selects agent_model and agent_effort', () => {
			const src = readFileSync(`src/routes/api/github/${endpoint}/+server.ts`, 'utf-8');
			expect(src).toMatch(/agent_model\s+agent_effort/);
		});
	}
);
