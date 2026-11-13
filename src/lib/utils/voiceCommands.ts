/** @file src/lib/utils/voiceCommands.ts — wake-word + intent parsing for the voice assistant (#237) */

export const DEFAULT_WAKE_WORD = 'Hopsti';

export type VoiceIntent = 'wake' | 'help' | 'unknown';

/** Phrases (en / et / cs) that mean "what can you do?". */
const HELP =
	/what can you do|what do you do|help|mida sa oskad|mis sa oskad|appi|abi|co umíš|pomoc/i;

const normalize = (s: string) =>
	s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter(Boolean);

function distance(a: string, b: string): number {
	const row = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		let prev = row[0];
		row[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const tmp = row[j];
			row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
			prev = tmp;
		}
	}
	return row[b.length];
}

/**
 * Finds the wake word in a transcript. Speech engines mishear made-up words
 * ("hopsti" → "hop see", "hopstee"), so one word or two joined words within a
 * small edit distance count. Returns the text after it, or null when absent.
 */
export function findWakeWord(transcript: string, wakeWord: string): string | null {
	const wake = normalize(wakeWord).join('');
	if (!wake) return null;
	const words = normalize(transcript);
	const tolerance = Math.round(wake.length / 3);
	for (let i = 0; i < words.length; i++) {
		for (const span of [1, 2]) {
			const candidate = words.slice(i, i + span).join('');
			if (i + span <= words.length && distance(candidate, wake) <= tolerance) {
				return words.slice(i + span).join(' ');
			}
		}
	}
	return null;
}

export function matchIntent(command: string): VoiceIntent {
	if (!command.trim()) return 'wake';
	return HELP.test(command) ? 'help' : 'unknown';
}

/** BCP-47 tag for the Web Speech API from the app's locale. */
export function speechLang(locale: string): string {
	return { et: 'et-EE', cs: 'cs-CZ' }[locale] ?? 'en-US';
}
