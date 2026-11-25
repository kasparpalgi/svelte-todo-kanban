/** @file src/lib/server/github/hasuraWebhook.ts */
// The webhook's reads and writes on Hasura: the queries the route made before #263.
import { serverRequest } from '$lib/graphql/server-client';
import {
	UPDATE_TODOS,
	CREATE_COMMENT,
	GET_COMMENTS,
	UPDATE_COMMENT,
	DELETE_COMMENT,
	GET_TODO_BY_GITHUB_ISSUE,
	GET_COMMENT_BY_GITHUB_ID,
	GET_USER_BY_GITHUB_USERNAME,
	CREATE_ACTIVITY_LOG,
	CREATE_NOTIFICATION,
	GET_ACTIVITY_LOG_BY_COMMIT_SHA,
	GET_TODO_BY_ID,
	GET_BOARD_BY_REPO,
	GET_TODO_BY_ISSUE_NUMBER
} from '$lib/graphql/documents';
import { RUNNER_STATUS } from '$lib/server/cardThread';
import {
	bellsFor,
	type CommentWrite,
	type List,
	type WebhookCard,
	type WebhookDb
} from './webhookDb';

type Todo = Partial<Omit<WebhookCard, 'assignees' | 'boardId' | 'ownerId'>> & {
	id: string;
	title: string;
	assignees?: { user_id: string }[];
	list?: { board?: { id?: string; user_id?: string; lists?: List[] } };
};

/** Every answer below, loosely: half these documents are raw strings, kept out of codegen. */
type Rows = {
	todos?: Todo[];
	todos_by_pk?: Todo | null;
	boards?: { id: string; user_id: string; lists: List[] }[];
	users?: { id: string }[];
	comments?: { id: string; content: string; user_id: string }[];
	activity_logs?: { id: string }[];
};

const ask = (doc: unknown, vars: object) => serverRequest<Rows, object>(doc as string, vars);

const toCard = (t: Todo): WebhookCard => ({
	id: t.id,
	title: t.title,
	content: t.content ?? null,
	completed_at: t.completed_at ?? null,
	priority: t.priority ?? null,
	list_id: t.list_id ?? null,
	github_issue_number: t.github_issue_number ?? null,
	assignees: (t.assignees ?? []).map((a) => a.user_id).filter(Boolean),
	boardId: t.list?.board?.id ?? null,
	ownerId: t.list?.board?.user_id ?? null
});

const byId = (id: string) => ({ where: { id: { _eq: id } } });

function writeComment(todoId: string, c: CommentWrite) {
	if ('add' in c) return ask(CREATE_COMMENT, { objects: [{ ...c.add, todo_id: todoId }] });
	if ('edit' in c) return ask(UPDATE_COMMENT, { ...byId(c.edit), _set: c.set });
	return ask(DELETE_COMMENT, byId(c.remove));
}

export const hasuraWebhook: WebhookDb = {
	async cardByIssue(githubIssueId) {
		const { todos } = await ask(GET_TODO_BY_GITHUB_ISSUE, { githubIssueId });
		return todos?.[0] ? toCard(todos[0]) : null;
	},
	async cardByNumber(repo, issueNumber) {
		const { todos } = await ask(GET_TODO_BY_ISSUE_NUMBER, { issueNumber, repo: `%${repo}%` });
		return todos?.[0] ? toCard(todos[0]) : null;
	},
	async cardWithLists(id) {
		const t = (await ask(GET_TODO_BY_ID, { id }))?.todos_by_pk;
		return t ? { ...toCard(t), lists: t.list?.board?.lists ?? null } : null;
	},
	// Hasura keeps finding the card through the DONE file's card line.
	cardIdByTaskFile: async () => null,
	async boardByRepo(repo) {
		const { boards } = await ask(GET_BOARD_BY_REPO, { fullName: `%${repo}%` });
		return boards?.[0] ?? null;
	},
	async userByLogin(githubUsername) {
		const { users } = await ask(GET_USER_BY_GITHUB_USERNAME, { githubUsername });
		return users?.[0]?.id ?? null;
	},
	async commentByGithubId(githubCommentId) {
		const { comments } = await ask(GET_COMMENT_BY_GITHUB_ID, { githubCommentId });
		return comments?.[0] ?? null;
	},
	async twin(todoId, body) {
		const { comments } = await ask(GET_COMMENTS, {
			where: {
				todo_id: { _eq: todoId },
				github_comment_id: { _is_null: true },
				content: { _eq: body }
			},
			limit: 1
		});
		return comments?.[0]?.id ?? null;
	},
	async ranByRunner(todoId) {
		const { comments } = await ask(GET_COMMENTS, {
			where: { todo_id: { _eq: todoId }, content: { _regex: RUNNER_STATUS.source } },
			limit: 1
		});
		return !!comments?.length;
	},
	async commitLogged(todoId, sha) {
		const vars = { todoId, commitSha: { commit_sha: sha } };
		return !!(await ask(GET_ACTIVITY_LOG_BY_COMMIT_SHA, vars)).activity_logs?.length;
	},
	async save(card, { set, comment, log, notify }) {
		if (set) await ask(UPDATE_TODOS, { ...byId(card.id), _set: set });
		if (comment) await writeComment(card.id, comment);
		if (log) {
			const { by, ...row } = log;
			await ask(CREATE_ACTIVITY_LOG, { log: { ...row, todo_id: card.id, user_id: by } }).catch(
				(err) => console.error(`Failed to log ${row.action_type} from GitHub:`, err)
			);
		}
		if (!notify) return;
		const { by, ...bell } = notify;
		for (const user_id of bellsFor(card, by)) {
			const notification = { ...bell, user_id, todo_id: card.id, triggered_by_user_id: by };
			await ask(CREATE_NOTIFICATION, { notification }).catch((err) =>
				console.error(`Failed to create ${bell.type} notification for ${card.id}:`, err)
			);
		}
	}
};
