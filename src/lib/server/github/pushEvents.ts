/** @file src/lib/server/github/pushEvents.ts */
// `push` webhook events on main/master: a commit that names an issue (#123) is logged on
// that issue's card, once, and a task-file rename to -DONE closes its card (taskDone.ts).
import type { Ctx } from '$lib/server/ops/op';
import { findTaskFileRenames } from '$lib/server/taskfile';
import { actorFor } from './issueEvents';
import { handleTaskFileDone, type PushCommit } from './taskDone';
import type { WebhookDb } from './webhookDb';

export interface GitHubPushEvent {
	ref: string;
	repository: { full_name: string };
	commits: PushCommit[];
}

/** Issue numbers a commit message names: `#123`, `fixes #456`, … */
export function extractIssueNumbers(message: string): number[] {
	return [...new Set([...message.matchAll(/#(\d+)/g)].map((m) => parseInt(m[1], 10)))];
}

async function logCommit(
	db: WebhookDb,
	repo: string,
	branch: string,
	commit: PushCommit,
	issueNumber: number
) {
	const short = commit.id.substring(0, 7);
	const card = await db.cardByNumber(repo, issueNumber);
	if (!card) {
		console.log(`Issue #${issueNumber} not found in ${repo} - skipping commit ${short}`);
		return;
	}
	// GitHub may redeliver the same push: don't log the commit twice.
	if (await db.commitLogged(card.id, commit.id)) {
		console.log(`Commit ${short} already logged for todo ${card.id}, skipping`);
		return;
	}
	const login = commit.author.username;
	const by = login ? await actorFor(db, login, card) : card.ownerId;
	if (!by) return;
	const author = login || commit.author.name;
	await db.save(card, {
		log: {
			by,
			action_type: 'github_commit',
			new_value: `${author}: ${commit.message.split('\n')[0]}`,
			changes: {
				source: 'github',
				commit_sha: commit.id,
				commit_short_sha: short,
				commit_url: commit.url,
				commit_author: author,
				commit_message: commit.message,
				branch,
				files_changed: commit.added.length + commit.modified.length + commit.removed.length
			}
		}
	});
	console.log(`Logged commit ${short} to todo ${card.id} (issue #${issueNumber})`);
}

export async function handlePushEvent(ctx: Ctx, db: WebhookDb, event: GitHubPushEvent) {
	const { commits, repository, ref } = event;
	const repo = repository.full_name;
	const branch = ref.replace('refs/heads/', '');
	if (!['main', 'master'].includes(branch)) {
		console.log(`Skipping push event on branch ${branch} (only processing main/master)`);
		return;
	}
	console.log(`Processing ${commits.length} commits from push event on ${repo}/${branch}`);

	for (const commit of commits) {
		for (const issueNumber of extractIssueNumbers(commit.message)) {
			await logCommit(db, repo, branch, commit, issueNumber).catch((error) =>
				console.error(`Error processing commit ${commit.id} for issue #${issueNumber}:`, error)
			);
		}
	}
	for (const commit of commits) {
		for (const rename of findTaskFileRenames(commit)) {
			await handleTaskFileDone(ctx, db, rename, commit, repo).catch((err: Error) =>
				console.error(`[016] ${rename.doneFile}: ${err.message}`)
			);
		}
	}
}
