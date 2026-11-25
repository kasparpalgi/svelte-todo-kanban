/** @file src/lib/server/github/issueEvents.ts */
// `issues` webhook events: an edit, close, reopen or priority label on GitHub changes the
// linked card, logs it as the GitHub user's app account and notifies the card's people.
import { now, type WebhookCard, type WebhookDb } from './webhookDb';

export interface GitHubIssueEvent {
	action: 'opened' | 'edited' | 'closed' | 'reopened' | 'deleted' | 'labeled' | 'unlabeled';
	issue: {
		id: number;
		number: number;
		title: string;
		body: string | null;
		state: 'open' | 'closed';
		closed_at: string | null;
	};
	label?: { name: string };
	sender?: { login: string };
	repository: { full_name: string };
}

/** The app user behind a GitHub login, else the board owner; null if neither. */
export async function actorFor(db: WebhookDb, login: string, card: WebhookCard) {
	try {
		return (await db.userByLogin(login)) ?? card.ownerId;
	} catch (error) {
		console.error('Error finding user by GitHub username:', error);
		return card.ownerId;
	}
}

/** Maps a GitHub "priority: high|medium|low" label name to our priority value. */
export function parsePriorityLabel(labelName: string): 'low' | 'medium' | 'high' | null {
	const match = /^priority:\s*(low|medium|high)$/i.exec(labelName.trim());
	return match ? (match[1].toLowerCase() as 'low' | 'medium' | 'high') : null;
}

export async function handleIssueEvent(db: WebhookDb, event: GitHubIssueEvent): Promise<void> {
	const { action, issue, label, sender } = event;
	const card = await db.cardByIssue(issue.id);
	if (!card) {
		console.log(`Issue #${issue.number} not found in database, skipping`);
		return;
	}
	console.log(`Processing GitHub issue event: ${action} for todo ${card.id}`);

	const by = sender?.login ? await actorFor(db, sender.login, card) : card.ownerId;
	const source = { source: 'github', github_issue_number: issue.number };
	const logged = (row: {
		action_type: string;
		field_name?: string;
		old_value?: string;
		new_value?: string;
	}) => (by ? { log: { ...row, by, changes: source } } : {});

	switch (action) {
		case 'edited': {
			const titleChanged = issue.title !== card.title;
			const set = {
				...(titleChanged && { title: issue.title }),
				...(issue.body !== card.content && { content: issue.body })
			};
			if (!Object.keys(set).length) break;
			await db.save(card, {
				set: { ...set, github_synced_at: now() },
				...logged(
					titleChanged
						? {
								action_type: 'title_changed',
								field_name: 'title',
								old_value: card.title,
								new_value: issue.title
							}
						: {
								action_type: 'content_updated',
								field_name: 'content',
								old_value: 'Content updated',
								new_value: 'Content updated'
							}
				),
				notify: { by, type: 'edited', content: `Issue #${issue.number} was edited on GitHub` }
			});
			console.log(`Updated todo ${card.id} from GitHub edit`);
			break;
		}

		case 'closed':
		case 'reopened': {
			const closing = action === 'closed';
			if (closing === !!card.completed_at) break; // already in that state
			await db.save(card, {
				set: { completed_at: closing ? issue.closed_at || now() : null, github_synced_at: now() },
				...logged({ action_type: closing ? 'completed' : 'uncompleted' })
			});
			console.log(`${closing ? 'Completed' : 'Reopened'} todo ${card.id} from GitHub`);
			break;
		}

		case 'labeled':
		case 'unlabeled': {
			const fromLabel = label ? parsePriorityLabel(label.name) : null;
			if (!fromLabel) {
				console.log(`Ignoring non-priority label "${label?.name}" on issue #${issue.number}`);
				break;
			}
			const priority = action === 'labeled' ? fromLabel : null;
			if (card.priority === priority) break; // already in sync
			// A different priority label was removed than the one the card has.
			if (action === 'unlabeled' && card.priority !== fromLabel) break;

			await db.save(card, {
				set: { priority, github_synced_at: now() },
				...logged({
					action_type: 'priority_changed',
					field_name: 'priority',
					old_value: card.priority || 'none',
					new_value: priority || 'none'
				}),
				notify: {
					by,
					type: 'priority_changed',
					content: `Priority changed to ${priority || 'none'} on GitHub`
				}
			});
			console.log(`Synced todo ${card.id} priority to "${priority}" from GitHub label`);
			break;
		}

		case 'deleted':
			console.log(`GitHub issue #${issue.number} was deleted, todo ${card.id} preserved`);
			break;

		default:
			console.log(`Unhandled issue action: ${action}`);
	}
}
