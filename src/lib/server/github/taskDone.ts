/** @file src/lib/server/github/taskDone.ts */
// A pushed commit that renames a task file -TODO → -DONE (or -BLOCKED) moves its card to
// Review, says so on the card and closes the issue, unless the runner ran the card: the
// runner closes those itself.
import { getGithubToken, githubRequest } from '$lib/server/github';
import type { Ctx } from '$lib/server/ops/op';
import type { TaskFileRename } from '$lib/server/taskfile';
import type { WebhookDb } from './webhookDb';

export type PushCommit = {
	id: string;
	message: string;
	url: string;
	author: { name: string; username?: string };
	added: string[];
	removed: string[];
	modified: string[];
};

/** The card id the DONE file's `_From Kanban card …_` line names. */
async function cardIdInFile(repo: string, path: string, sha: string, token: string | null) {
	if (!token) return null;
	try {
		const file = await githubRequest<{ content: string }>(
			`/repos/${repo}/contents/${path}?ref=${sha}`,
			token
		);
		const text = Buffer.from(file.content, 'base64').toString('utf-8');
		return /From Kanban card `([0-9a-f-]+)`/.exec(text)?.[1] ?? null;
	} catch (err) {
		console.log(`[016] Could not fetch DONE file content: ${(err as Error).message}`);
		return null;
	}
}

export async function handleTaskFileDone(
	ctx: Ctx,
	db: WebhookDb,
	rename: TaskFileRename,
	commit: PushCommit,
	repo: string
): Promise<void> {
	const board = await db.boardByRepo(repo);
	if (!board) {
		console.log(`[016] No board found for repo ${repo}`);
		return;
	}
	const token = await getGithubToken(ctx, board.user_id);
	const cardId =
		(await db.cardIdByTaskFile(repo, rename.todoFile)) ??
		(await cardIdInFile(repo, rename.doneFile, commit.id, token));
	if (!cardId) {
		console.log(`[016] Card ID not found for ${rename.doneFile}, skipping`);
		return;
	}
	const card = await db.cardWithLists(cardId);
	if (!card) {
		console.log(`[016] Todo ${cardId} not found`);
		return;
	}

	// The runner closes a card it ran: Review, its Results, the issue. Doing it here too put
	// "✅ Task complete" beside the Results, and closed the issue before the Results reached
	// it, a -BLOCKED one too (svelte-hasura-boilerplate#80). Without a runner this stays the path.
	if (await db.ranByRunner(cardId)) {
		console.log(`[016] Card ${cardId} has a runner status line, the runner closes it`);
		return;
	}

	const lists = card.lists ?? board.lists;
	const current = lists.find((l) => l.id === card.list_id);
	if (current && !/todo/i.test(current.name)) {
		console.log(`[016] Card ${cardId} already in "${current.name}", skipping`);
		return;
	}

	const review = lists.find((l) => /review/i.test(l.name));
	if (!review) console.log(`[016] No Review list on board, skipping move`);
	const owner = card.ownerId ?? board.user_id;
	const sha = commit.id.substring(0, 7);
	await db.save(card, {
		...(review && { set: { list_id: review.id } }),
		comment: {
			add: {
				id: crypto.randomUUID(),
				user_id: owner,
				content: `✅ **Task complete** — [\`${sha}\`](${commit.url})\n\n\`${rename.doneFile}\``
			}
		}
	});
	console.log(`[016] Card ${cardId} to "${review?.name}", completion comment posted`);

	if (!card.github_issue_number || !token) return;
	try {
		await githubRequest(`/repos/${repo}/issues/${card.github_issue_number}`, token, {
			method: 'PATCH',
			body: JSON.stringify({ state: 'closed' })
		});
		console.log(`[016] Closed GitHub issue #${card.github_issue_number}`);
	} catch (err) {
		console.error(`[016] Failed to close GitHub issue: ${(err as Error).message}`);
	}
}
