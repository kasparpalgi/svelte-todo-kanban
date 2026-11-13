/** @file src/lib/api/__tests__/poll.svelte.test.ts */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { call } from '../call';
import { POLL_MS, watchPoll } from '../poll';

vi.mock('../call', () => ({ call: vi.fn() }));
vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false, version: '1' }));

const setHidden = (hidden: boolean) =>
	Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });

describe('watchPoll', () => {
	const stops: (() => void)[] = [];

	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(call).mockReset();
		vi.mocked(call).mockResolvedValue({ board: 'fp', unread: 2 });
		setHidden(false);
	});

	afterEach(() => {
		stops.splice(0).forEach((stop) => stop());
		vi.useRealTimers();
	});

	it('sends one request every 30 s for all watchers, with the watched board', async () => {
		const board = vi.fn();
		const bell = vi.fn();
		stops.push(watchPoll({ boardId: () => 'b1', onResult: board }), watchPoll({ onResult: bell }));

		await vi.advanceTimersByTimeAsync(POLL_MS);

		expect(call).toHaveBeenCalledTimes(1);
		expect(call).toHaveBeenCalledWith('poll', { boardId: 'b1' });
		expect(board).toHaveBeenCalledWith({ boardId: 'b1', board: 'fp', unread: 2 });
		expect(bell).toHaveBeenCalledWith({ boardId: 'b1', board: 'fp', unread: 2 });
	});

	it('skips while the tab is hidden and polls as soon as it is visible again', async () => {
		stops.push(watchPoll({ onResult: vi.fn() }));
		setHidden(true);
		await vi.advanceTimersByTimeAsync(POLL_MS * 3);
		expect(call).not.toHaveBeenCalled();

		setHidden(false);
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(0);
		expect(call).toHaveBeenCalledWith('poll', {});
	});

	it('stops when the last watcher leaves', async () => {
		const stop = watchPoll({ onResult: vi.fn() });
		stop();
		await vi.advanceTimersByTimeAsync(POLL_MS * 2);
		expect(call).not.toHaveBeenCalled();
	});
});
