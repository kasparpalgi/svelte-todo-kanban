/** @file src/lib/server/github/commentEvents.ts */
// `issue_comment` webhook events: a comment written, edited or deleted on GitHub does the
// same on the linked card. Redeliveries find the comment by its GitHub id and change nothing.
import { preview } from '$lib/server/ops/comments';
import { actorFor } from './issueEvents';
import { now, type WebhookCard, type WebhookDb } from './webhookDb';

export interface GitHubCommentEvent {
	action: 'created' | 'edited' | 'deleted';
	comment: { id: number; body: string; user: { login: string } };
	issue: { id: number; number: number };
	repository: { full_name: string };
}

type Comment = GitHubCommentEvent['comment'];

/**
 * The runner and the board post on the card first and on the issue second, so a new issue
 * comment whose text the card already holds, unlinked, is that same comment coming back.
 * Copying it showed the runner's Results twice on nine cards (svelte-hasura-boilerplate#80).
 * Link it instead, so a later edit or delete on GitHub still finds it.
 */
async function linkTwin(db: WebhookDb, card: WebhookCard, comment: Comment) {
	const twin = await db.twin(card.id, comment.body);
	if (!twin) return false;
	await db.save(card, {
		comment: { edit: twin, set: { github_comment_id: comment.id, github_synced_at: now() } }
	});
	console.log(`Linked comment ${twin} to GitHub comment ${comment.id}, not copied`);
	return true;
}

async function created(db: WebhookDb, card: WebhookCard, comment: Comment) {
	if ((await db.commentByGithubId(comment.id)) || (await linkTwin(db, card, comment))) return;
	const login = comment.user.login;
	const mapped = await db.userByLogin(login).catch(() => null);
	// A GitHub user with no app account writes as the board owner, under their own name.
	const author = mapped ?? card.ownerId;
	if (!author) {
		console.log(`Could not create comment: user mapping failed for ${login}`);
		return;
	}
	const id = crypto.randomUUID();
	await db.save(card, {
		comment: {
			add: {
				id,
				user_id: author,
				content: mapped ? comment.body : `**[${login} on GitHub]:**\n\n${comment.body}`,
				github_comment_id: comment.id,
				github_synced_at: now()
			}
		},
		log: {
			by: author,
			action_type: 'commented',
			new_value: preview(comment.body, 200),
			changes: {
				source: 'github',
				github_comment_id: comment.id,
				github_user: login,
				is_fallback_user: !mapped
			}
		},
		notify: {
			by: mapped,
			type: 'commented',
			content: `${login} commented on GitHub: "${preview(comment.body, 100)}"`,
			related_comment_id: id
		}
	});
	console.log(`Created comment ${id} from GitHub comment ${comment.id}`);
}

async function edited(db: WebhookDb, card: WebhookCard, comment: Comment) {
	const old = await db.commentByGithubId(comment.id);
	if (!old || old.content === comment.body) return;
	const by = await actorFor(db, comment.user.login, card);
	await db.save(card, {
		comment: { edit: old.id, set: { content: comment.body, github_synced_at: now() } },
		...(by && {
			log: {
				by,
				action_type: 'comment_edited',
				old_value: preview(old.content, 200),
				new_value: preview(comment.body, 200),
				changes: { source: 'github', github_comment_id: comment.id }
			}
		}),
		notify: {
			by,
			type: 'comment_edited',
			content: `${comment.user.login} edited a comment on GitHub`,
			related_comment_id: old.id
		}
	});
	console.log(`Updated comment ${old.id} from GitHub edit`);
}

async function deleted(db: WebhookDb, card: WebhookCard, comment: Comment) {
	const old = await db.commentByGithubId(comment.id);
	if (!old) return;
	const by = (await actorFor(db, comment.user.login, card)) ?? old.user_id;
	await db.save(card, {
		comment: { remove: old.id },
		log: {
			by,
			action_type: 'comment_deleted',
			changes: { source: 'github', github_comment_id: comment.id }
		},
		notify: {
			by,
			type: 'comment_removed',
			content: `${comment.user.login} deleted a comment on GitHub`
		}
	});
	console.log(`Deleted comment ${old.id} from GitHub comment deletion ${comment.id}`);
}

const handlers = { created, edited, deleted };

export async function handleCommentEvent(db: WebhookDb, event: GitHubCommentEvent): Promise<void> {
	const { action, comment, issue } = event;
	const card = await db.cardByIssue(issue.id);
	if (!card) {
		console.log(`Issue #${issue.number} not found, skipping comment event`);
		return;
	}
	console.log(`Processing GitHub comment event: ${action} for todo ${card.id}`);
	if (Object.hasOwn(handlers, action)) await handlers[action](db, card, comment);
	else console.log(`Unhandled comment action: ${action}`);
}
