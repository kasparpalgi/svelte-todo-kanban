/** @file src/lib/server/taskdir.ts */
import { githubRequest } from '$lib/server/github';
import { numberOf } from '$lib/server/taskfile';

type Entry = { name: string; sha: string; type?: string };

async function listDir(repo: string, dir: string, token: string): Promise<Entry[] | null> {
	try {
		const entries = await githubRequest<Entry[]>(`/repos/${repo}/contents/${dir}`, token);
		return Array.isArray(entries) ? entries.filter((e) => (e.type ?? 'file') === 'file') : [];
	} catch (err) {
		if ((err as Error).message?.includes('(404)')) return null;
		throw err;
	}
}

/** `.claude/todo` when the repo has one, else `doc/todo` — the same rule the runner uses. */
async function taskEntries(repo: string, token: string) {
	const dotClaude = await listDir(repo, '.claude/todo', token);
	if (dotClaude) return { dir: '.claude/todo', entries: dotClaude };
	return { dir: 'doc/todo', entries: (await listDir(repo, 'doc/todo', token)) ?? [] };
}

/** `053-x-DONE.md` and its `053-x.log` share the stem `053-x`. */
const stemOf = (name: string) => name.replace(/(-DONE)?\.(md|log)$/i, '');

/**
 * The files to move aside so issue `#n` can have `n` as its task number. Only finished
 * work moves: every `-DONE.md` numbered `n` and up, with its `.log`. A draft, a queued
 * `-TODO.md` or a `-BLOCKED.md` a person still owes stays put — and when one of those
 * holds `n`, nothing moves and the caller falls back to the next free number. `keep`,
 * the card's own draft, neither moves nor counts as holding `n`.
 */
export function toArchive(names: string[], n: number, keep?: string): string[] {
	const done = new Set(names.filter((x) => numberOf(x) >= n && /-DONE\.md$/i.test(x)).map(stemOf));
	const movable = names.filter(
		(x) => x !== keep && /(-DONE\.md|\.log)$/i.test(x) && done.has(stemOf(x))
	);
	const holders = names.filter((x) => numberOf(x) === n && x !== keep);
	return holders.length && holders.every((x) => movable.includes(x)) ? movable : [];
}

type TreeEntry = { path: string; mode: '100644'; type: 'blob' } & (
	| { sha: string | null }
	| { content: string }
);

/**
 * Change several files on the default branch as one commit, through the Git data API.
 * An entry with `sha: null` deletes its path; one with `content` writes it.
 *
 * Two cards moved seconds apart race for the branch: the loser's ref update is "not a
 * fast forward" (422). The tree names paths, not a snapshot, so rebuilding it on the new
 * head is safe — try again a few times before giving up.
 */
export async function commitTree(repo: string, token: string, message: string, tree: TreeEntry[]) {
	const api = `/repos/${repo}/git`;
	const { default_branch: branch } = await githubRequest(`/repos/${repo}`, token);
	for (let attempt = 1; ; attempt++) {
		const head = await githubRequest(`${api}/ref/heads/${branch}`, token);
		const parent = await githubRequest(`${api}/commits/${head.object.sha}`, token);
		const next = await githubRequest(`${api}/trees`, token, {
			method: 'POST',
			body: JSON.stringify({ base_tree: parent.tree.sha, tree })
		});
		const commit = await githubRequest(`${api}/commits`, token, {
			method: 'POST',
			body: JSON.stringify({ message, tree: next.sha, parents: [head.object.sha] })
		});
		try {
			await githubRequest(`${api}/refs/heads/${branch}`, token, {
				method: 'PATCH',
				body: JSON.stringify({ sha: commit.sha })
			});
			return;
		} catch (err) {
			if (attempt >= 3 || !/not a fast.forward/i.test((err as Error).message)) throw err;
		}
	}
}

/**
 * Move files into `<dir>/archive/` as one commit. The Git data API reuses each blob by
 * sha, so a transcript over the contents API's 1 MB limit moves intact.
 */
async function archive(repo: string, dir: string, files: Entry[], token: string, ref: string) {
	await commitTree(
		repo,
		token,
		`docs(todo): archive ${files.map((f) => f.name).join(', ')}${ref}`,
		files.flatMap((f) => [
			{ path: `${dir}/archive/${f.name}`, mode: '100644', type: 'blob', sha: f.sha },
			{ path: `${dir}/${f.name}`, mode: '100644', type: 'blob', sha: null }
		])
	);
}

/**
 * Free issue `#n`'s number in the task folder, so the file number always matches the
 * issue. Returns the folder and its listing afterwards.
 */
export async function makeRoom(
	repo: string,
	token: string,
	n: number | null | undefined,
	ref: string,
	keep?: string
) {
	const { dir, entries } = await taskEntries(repo, token);
	const moving = n
		? toArchive(
				entries.map((e) => e.name),
				n,
				keep
			)
		: [];
	if (moving.length) {
		await archive(
			repo,
			dir,
			entries.filter((e) => moving.includes(e.name)),
			token,
			ref
		);
	}
	return { dir, names: entries.map((e) => e.name).filter((name) => !moving.includes(name)) };
}

/**
 * The files to delete with a card whose task file is `name`: its draft, `-TODO.md` and
 * `.log`. A `-DONE.md` or `-BLOCKED.md` is a finished run whose commits point at it, so
 * once either exists the whole stem stays as history.
 */
export function toDelete(names: string[], name: string): string[] {
	const stem = name.replace(/(-TODO|-DONE|-BLOCKED)?\.md$/i, '');
	const mine = names.filter((x) => [`${stem}.md`, `${stem}-TODO.md`, `${stem}.log`].includes(x));
	const finished = names.some((x) => x === `${stem}-DONE.md` || x === `${stem}-BLOCKED.md`);
	return finished ? [] : mine;
}

/** Delete a deleted card's unfinished task files in one commit; returns what went. */
export async function dropTaskFiles(repo: string, token: string, path: string, ref: string) {
	const dir = path.slice(0, path.lastIndexOf('/'));
	const entries = (await listDir(repo, dir, token)) ?? [];
	const names = toDelete(
		entries.map((e) => e.name),
		path.slice(dir.length + 1)
	);
	if (names.length) {
		await commitTree(
			repo,
			token,
			`docs(todo): delete ${names.join(', ')} with its card${ref}`,
			names.map((n) => ({ path: `${dir}/${n}`, mode: '100644', type: 'blob', sha: null }))
		);
	}
	return names;
}
