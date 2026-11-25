/** @file src/lib/server/github/webhookDb.ts */
// What the GitHub webhook reads and writes, as one interface with a Hasura and a D1 side
// (#263), so the event handlers are written once and run on either backend.
import type { ActivityRow } from '$lib/server/ops/cardActivity';

/** A card the webhook acts on, with the people it notifies. */
export type WebhookCard = {
	id: string;
	title: string;
	content: string | null;
	completed_at: string | null;
	priority: string | null;
	list_id: string | null;
	github_issue_number: number | null;
	assignees: string[];
	boardId: string | null;
	ownerId: string | null;
};

export type List = { id: string; name: string };

export type CardSet = Partial<
	Pick<WebhookCard, 'title' | 'content' | 'completed_at' | 'priority' | 'list_id'>
> & { github_synced_at?: string };

type CommentCols = { content?: string; github_comment_id?: number; github_synced_at?: string };

export type CommentWrite =
	| { add: CommentCols & { id: string; user_id: string; content: string } }
	| { edit: string; set: CommentCols }
	| { remove: string };

/** One change on one card: its writes, the activity row (by `by`) and the bells. */
export type Change = {
	set?: CardSet;
	comment?: CommentWrite;
	log?: ActivityRow & { by: string };
	notify?: { by: string | null; type: string; content: string; related_comment_id?: string };
};

export interface WebhookDb {
	cardByIssue(issueId: number): Promise<WebhookCard | null>;
	cardByNumber(repo: string, issueNumber: number): Promise<WebhookCard | null>;
	cardWithLists(id: string): Promise<(WebhookCard & { lists: List[] | null }) | null>;
	/** The card whose task file is `path`, on a board linked to `repo`. */
	cardIdByTaskFile(repo: string, path: string): Promise<string | null>;
	boardByRepo(repo: string): Promise<{ id: string; user_id: string; lists: List[] } | null>;
	/** The app user who connected this GitHub login. */
	userByLogin(login: string): Promise<string | null>;
	commentByGithubId(id: number): Promise<{ id: string; content: string; user_id: string } | null>;
	/** A comment on the card with this exact text and no GitHub link yet. */
	twin(todoId: string, body: string): Promise<string | null>;
	/** Has the runner posted a status line on the card? */
	ranByRunner(todoId: string): Promise<boolean>;
	commitLogged(todoId: string, sha: string): Promise<boolean>;
	save(card: WebhookCard, change: Change): Promise<void>;
}

/** Every assignee, or the board owner when there are none, never the one who did it. */
export function bellsFor(card: WebhookCard, by: string | null): string[] {
	const people = new Set(card.assignees.length ? card.assignees : [card.ownerId ?? '']);
	people.delete(by ?? '');
	people.delete('');
	return [...people];
}

export const now = () => new Date().toISOString();
