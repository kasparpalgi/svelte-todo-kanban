/** @file src/lib/server/cardThread.ts */
/**
 * The card's comments, carried into its task file. A card sent back from Review to the
 * agent list used to get a file holding only its body, so the reviewer's "still broken on
 * mobile" never reached the agent and the re-run repeated the first one
 * (svelte-hasura-boilerplate#59).
 */
import { toText } from './taskfile';

export interface CardComment {
	content?: string | null;
	created_at?: string | null;
	user?: { name?: string | null; username?: string | null } | null;
}

/** The board's own notes about the file — bookkeeping, not something a person said. */
const NOTE =
	/^(Task file (ready|back to draft):|Could not (write|unqueue) the task file|✅ \*\*Task complete\*\*)/;

const HEADING = '## Card comments';

/** `2026-11-07T14:05:09.123+00:00` → `2026-11-07 14:05` */
const when = (at?: string | null) => (at ? ` · ${at.slice(0, 16).replace('T', ' ')}` : '');

/**
 * Append the thread, oldest first. A section from an earlier queueing (the card went back to
 * draft and returned) is replaced, not repeated. No human comment leaves the body untouched.
 */
export function withComments(body: string, comments: CardComment[] = []): string {
	const base = body.replace(new RegExp(`\\n+${HEADING}\\n[\\s\\S]*$`), '');
	const said = comments
		.map((c) => ({ ...c, text: toText(c.content) }))
		.filter((c) => c.text && !NOTE.test(c.text));
	if (!said.length) return base === body ? body : `${base.trimEnd()}\n`;

	const thread = said.map(
		(c) => `**${c.user?.name || c.user?.username || 'Someone'}**${when(c.created_at)}\n\n${c.text}`
	);
	return [
		base.trimEnd(),
		'',
		HEADING,
		'',
		'_Oldest first. On a card sent back for rework, the latest say what to change._',
		'',
		thread.join('\n\n---\n\n'),
		''
	].join('\n');
}
