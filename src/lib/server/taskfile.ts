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

const TIERS: Record<string, string> = {
	opus: 'Opus 5 / high',
	sonnet: 'Sonnet 5 / medium',
	haiku: 'Haiku 4.5 / low'
};

/** The card may name its own tier ("Run with: opus"); otherwise assume a normal feature. */
export function runWithLabel(text: string): string {
	const named = /run with:\s*(opus|sonnet|haiku)/i.exec(text || '');
	return named ? TIERS[named[1].toLowerCase()] : TIERS.sonnet;
}

export interface TaskCard {
	id: string;
	title: string;
	content?: string | null;
}

/** Highest NNN already used in the folder, plus one, zero-padded. */
export function nextNumber(filenames: string[]): string {
	const used = filenames
		.map((f) => Number.parseInt(f.slice(0, 3), 10))
		.filter((n) => Number.isInteger(n));
	return String(Math.max(0, ...used) + 1).padStart(3, '0');
}

export function buildTaskFile(card: TaskCard): string {
	const body = toText(card.content);
	return [
		`> Run with: ${runWithLabel(`${card.title}\n${body}`)}`,
		'',
		`# ${card.title}`,
		'',
		'## Original Requirement',
		'',
		'[NEVER REMOVE]',
		'',
		body || '_(no description on the card)_',
		'',
		`_From Kanban card \`${card.id}\`, moved to the agent list._`,
		''
	].join('\n');
}
