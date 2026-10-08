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

/**
 * The files to move aside so issue `#n` can have `n` as its task number: when `n` is
 * taken, everything numbered `n` and up goes to `archive/`. A live `-TODO.md` stays —
 * it is another card's queued work — and so does `keep`, the card's own draft.
 */
export function toArchive(names: string[], n: number, keep?: string): string[] {
	const movable = names.filter(
		(name) => numberOf(name) >= n && name !== keep && !name.endsWith('-TODO.md')
	);
	return movable.some((name) => numberOf(name) === n) ? movable : [];
}

/**
 * Move files into `<dir>/archive/` as one commit. The Git data API reuses each blob by
 * sha, so a transcript over the contents API's 1 MB limit moves intact.
 */
async function archive(repo: string, dir: string, files: Entry[], token: string, ref: string) {
	const api = `/repos/${repo}/git`;
	const { default_branch: branch } = await githubRequest(`/repos/${repo}`, token);
	const head = await githubRequest(`${api}/ref/heads/${branch}`, token);
	const parent = await githubRequest(`${api}/commits/${head.object.sha}`, token);
	const tree = await githubRequest(`${api}/trees`, token, {
		method: 'POST',
		body: JSON.stringify({
			base_tree: parent.tree.sha,
			tree: files.flatMap((f) => [
				{ path: `${dir}/archive/${f.name}`, mode: '100644', type: 'blob', sha: f.sha },
				{ path: `${dir}/${f.name}`, mode: '100644', type: 'blob', sha: null }
			])
		})
	});
	const message = `docs(todo): archive ${files.map((f) => f.name).join(', ')}${ref}`;
	const commit = await githubRequest(`${api}/commits`, token, {
		method: 'POST',
		body: JSON.stringify({ message, tree: tree.sha, parents: [head.object.sha] })
	});
	await githubRequest(`${api}/refs/heads/${branch}`, token, {
		method: 'PATCH',
		body: JSON.stringify({ sha: commit.sha })
	});
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
