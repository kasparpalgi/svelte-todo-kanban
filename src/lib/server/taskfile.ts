/** @file src/lib/server/taskfile.ts */
/** Turn a Kanban card into the body of `doc/todo/NNN-name-TODO.md`. */

/** "Fix the login redirect" -> "fixTheLoginRedirect" */
export function camelName(title: string): string {
	const words = (title || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean)
		.slice(0, 4);
	if (!words.length) return 'kanbanTask';
	return (
		words[0] +
		words
			.slice(1)
			.map((w) => w[0].toUpperCase() + w.slice(1))
			.join('')
	);
}

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	'#39': "'",
	nbsp: ' '
};

/**
 * The card editor stores bodies as HTML; task files are markdown. Plain-text cards
 * (voice input, pasted checklists) contain no tags and pass through untouched.
 */
export function toText(content?: string | null): string {
	if (!content || !/<[a-z/]/i.test(content)) return (content ?? '').trim();
	return content
		.replace(/<li\b[^>]*>/gi, '\n- ')
		.replace(/<(br|\/p|\/h[1-6]|\/ul|\/ol|\/div)\b[^>]*>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&([a-z]+|#\d+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m)
		.replace(/[ \t]+$/gm, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * A tier label is `<Name> <version> / <effort>` — the runner pins that exact model
 * id, so the version is not decoration. `latest` is what a bare family name means.
 */
const FAMILIES: Record<string, { name: string; latest: string; effort: string }> = {
	fable: { name: 'Fable', latest: '5.1', effort: 'high' },
	opus: { name: 'Opus', latest: '5', effort: 'high' },
	sonnet: { name: 'Sonnet', latest: '5', effort: 'medium' },
	haiku: { name: 'Haiku', latest: '4.5', effort: 'low' }
};

const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];

function label(family: string, version?: string | null, effort?: string | null): string | null {
	const f = FAMILIES[family];
	if (!f) return null;
	const e = effort && EFFORTS.includes(effort.toLowerCase()) ? effort.toLowerCase() : f.effort;
	return `${f.name} ${version || f.latest} / ${e}`;
}

const NAMED = /\b(fable|opus|sonnet|haiku)\b[ \t]*(\d+(?:\.\d+)?)?[ \t]*(?:\/[ \t]*(\w+))?/i;
const PREFIXED = new RegExp(`run with:[ \\t]*${NAMED.source}`, 'i');

/** Looks for a hand-typed tier in card prose ("Run with: opus 4.8 / xhigh" or a bare "Sonnet 4.6"). Null when nothing is named. */
export function detectRunWith(text: string): string | null {
	for (const re of [PREFIXED, NAMED]) {
		const m = re.exec(text || '');
		if (m) return label(m[1].toLowerCase(), m[2], m[3]);
	}
	return null;
}

/** The card may name its own tier ("Run with: opus" or "Sonnet 4.6"); otherwise assume a normal feature. */
export function runWithLabel(text: string): string {
	return detectRunWith(text) ?? (label('sonnet') as string);
}

/**
 * `agent_model` is a family, optionally version-pinned: `sonnet`, `sonnet-4.6`,
 * `opus-4.8`. An unpinned family means that family's latest.
 */
function fieldLabel(model: string, effort?: string | null): string | null {
	const [family, version] = model.toLowerCase().split(/[-@]/, 2);
	return label(family, version, effort);
}

export interface TaskCard {
	id: string;
	title: string;
	content?: string | null;
	agent_model?: string | null;
	agent_effort?: string | null;
	github_issue_number?: number | null;
}

/**
 * The `agent_model`/`agent_effort` card fields win when set. Otherwise fall back to a
 * hand-typed "Run with:" line in the card's own text (older cards, before the fields
 * existed). Null means the card is on *auto* — omit the line so the runner's classifier
 * picks the tier itself.
 */
function resolveRunWith(card: TaskCard, body: string): string | null {
	const field = card.agent_model ? fieldLabel(card.agent_model, card.agent_effort) : null;
	return field ?? detectRunWith(`${card.title}\n${body}`);
}

/** The leading NNN of a task filename, or NaN. Issue numbers outgrow three digits. */
const numberOf = (filename: string) => Number.parseInt(/^(\d+)-/.exec(filename)?.[1] ?? '', 10);

/** Zero-padded to the three digits every existing file uses; wider numbers keep their width. */
const pad = (n: number) => String(n).padStart(3, '0');

/**
 * The GitHub issue number *is* the task number, so `#165` becomes `165-slug-TODO.md`
 * and every commit that names `#165` shows up on the issue. Falls back to highest+1
 * when the card has no issue, or when something already claimed that number.
 */
export function nextNumber(filenames: string[], issueNumber?: number | null): string {
	const used = filenames.map(numberOf).filter((n) => Number.isInteger(n));
	if (issueNumber && !used.includes(issueNumber)) return pad(issueNumber);
	return pad(Math.max(0, ...used) + 1);
}

/**
 * The `-TODO.md` path a draft becomes when its card reaches the agent list. A draft
 * written before its issue existed carries the wrong number; renumber it now, while
 * the file is being rewritten anyway.
 */
export function todoPathFor(draftPath: string, issueNumber?: number | null): string {
	const todoPath = draftPath.replace(/\.md$/, '-TODO.md');
	if (!issueNumber) return todoPath;
	const cut = todoPath.lastIndexOf('/') + 1;
	return todoPath.slice(0, cut) + todoPath.slice(cut).replace(/^\d+-/, `${pad(issueNumber)}-`);
}

/**
 * Naming the issue in the file is what makes the agent end its commit subject with
 * `(#165)` — GitHub then links the commit onto the issue.
 */
function issueLine(card: TaskCard): string[] {
	const n = card.github_issue_number;
	return n ? [`_GitHub issue #${n} — end the commit subject with \`(#${n})\`._`, ''] : [];
}

/** Draft file written at card creation — no `-TODO` suffix, no "moved to agent list" note. */
export function buildDraftFile(card: TaskCard): string {
	const body = toText(card.content);
	const runWith = resolveRunWith(card, body);
	return [
		...(runWith ? [`> Run with: ${runWith}`, ''] : []),
		`# ${card.title}`,
		'',
		'## Original Requirement',
		'',
		'[NEVER REMOVE]',
		'',
		body || '_(no description yet)_',
		'',
		...issueLine(card)
	].join('\n');
}

/** Full task file written when a card reaches the agent list (or as fallback). */
export function buildTaskFile(card: TaskCard): string {
	const body = toText(card.content);
	const runWith = resolveRunWith(card, body);
	return [
		...(runWith ? [`> Run with: ${runWith}`, ''] : []),
		`# ${card.title}`,
		'',
		'## Original Requirement',
		'',
		'[NEVER REMOVE]',
		'',
		body || '_(no description on the card)_',
		'',
		`_From Kanban card \`${card.id}\`, moved to the agent list._`,
		'',
		...issueLine(card)
	].join('\n');
}

/** A repo keeps its task files in either `doc/todo/` or `.claude/todo/`. */
const TODO_DIR = '(?:doc|\\.claude)/todo';

export interface TaskFileRename {
	number: string;
	todoFile: string;
	doneFile: string;
}

/**
 * A pushed commit that removes `NNN-slug-TODO.md` and adds `NNN-slug-DONE.md` — or
 * `-BLOCKED.md`, the agent finishing its half and handing the rest to a human — is the
 * agent reporting the task over. Either pair moves the card to Review.
 */
export function findTaskFileRenames(commit: {
	added: string[];
	removed: string[];
}): TaskFileRename[] {
	const results: TaskFileRename[] = [];
	for (const removed of commit.removed) {
		const m = new RegExp(`${TODO_DIR}/(\\d{3,})-.*-TODO\\.md$`, 'i').exec(removed);
		if (!m) continue;
		const added = commit.added.find((f) =>
			new RegExp(`${TODO_DIR}/${m[1]}-.*-(DONE|BLOCKED)\\.md$`, 'i').test(f)
		);
		if (added) results.push({ number: m[1], todoFile: removed, doneFile: added });
	}
	return results;
}
