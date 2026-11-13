/** @file src/lib/api/poll.ts */
// One 30 s poll per tab for everything that watches the server (the open board, the
// notification bell), paused while the tab is hidden. Every browser call counts
// against Workers Free's 100k requests a day.
import { browser } from '$app/environment';
import { call } from './call';

export const POLL_MS = 30_000;

export type PollResult = { boardId: string | null; board: string | null; unread: number };

export type PollWatcher = {
	/** The board this watcher wants a fingerprint for; null or undefined for none. */
	boardId?: () => string | null | undefined;
	onResult: (result: PollResult) => void;
};

const watchers = new Set<PollWatcher>();
let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;

/** Polls now, unless the tab is hidden or offline. Concurrent calls share one request. */
export function pollNow(): Promise<void> {
	if (!browser || document.hidden || !navigator.onLine || watchers.size === 0) {
		return Promise.resolve();
	}
	inFlight ??= (async () => {
		const boardId = [...watchers].map((w) => w.boardId?.()).find(Boolean) ?? null;
		try {
			const result = await call('poll', boardId ? { boardId } : {});
			for (const watcher of watchers) watcher.onResult({ boardId, ...result });
		} catch (error) {
			// Offline or signed out: the next tick tries again; nothing to log.
			console.debug('[poll] failed', error);
		} finally {
			inFlight = null;
		}
	})();
	return inFlight;
}

function onVisibilityChange() {
	if (!document.hidden) void pollNow();
}

/** Starts receiving poll results; returns the function that stops it. */
export function watchPoll(watcher: PollWatcher): () => void {
	if (!browser) return () => {};
	watchers.add(watcher);
	if (!timer) {
		timer = setInterval(() => void pollNow(), POLL_MS);
		document.addEventListener('visibilitychange', onVisibilityChange);
	}
	return () => {
		watchers.delete(watcher);
		if (watchers.size > 0 || !timer) return;
		clearInterval(timer);
		timer = null;
		document.removeEventListener('visibilitychange', onVisibilityChange);
	};
}
