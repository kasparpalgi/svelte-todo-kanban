/** @file src/lib/stores/__tests__/voiceAssistant.svelte.test.ts */
// The always-on listener answers "Hopsti …" and keeps itself running (#237).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { voiceAssistant } from '../voiceAssistant.svelte';
import { displayMessage } from '../errorSuccess.svelte';

vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false }));
vi.mock('../errorSuccess.svelte', () => ({ displayMessage: vi.fn() }));
vi.mock('$lib/i18n', async () => {
	const { readable } = await import('svelte/store');
	return { t: readable((key: string) => key) };
});

class FakeRecognition {
	static last: FakeRecognition;
	lang = '';
	continuous = false;
	interimResults = true;
	onstart: (() => void) | null = null;
	onresult: ((e: unknown) => void) | null = null;
	onerror: ((e: { error: string }) => void) | null = null;
	onend: (() => void) | null = null;
	start = vi.fn(() => this.onstart?.());
	stop = vi.fn(() => this.onend?.());
	constructor() {
		FakeRecognition.last = this;
	}
	say(transcript: string) {
		const result = Object.assign([{ transcript, confidence: 1 }], { isFinal: true });
		this.onresult?.({ resultIndex: 0, results: [result] });
	}
}

beforeEach(() => {
	vi.useFakeTimers();
	(window as any).SpeechRecognition = FakeRecognition;
	vi.spyOn(speechSynthesis, 'speak').mockImplementation(() => {});
	vi.mocked(displayMessage).mockClear();
});

afterEach(() => {
	voiceAssistant.stop();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const lastReply = () => vi.mocked(displayMessage).mock.calls.at(-1)?.[0];

describe('voiceAssistant', () => {
	it('starts listening in the app language', () => {
		voiceAssistant.start('Hopsti', 'et');
		expect(FakeRecognition.last.lang).toBe('et-EE');
		expect(voiceAssistant.listening).toBe(true);
	});

	it('answers the wake word and speaks the reply', () => {
		voiceAssistant.start('Hopsti', 'en');
		FakeRecognition.last.say('Hopsti, what can you do?');
		expect(lastReply()).toBe('voice_assistant.reply_help');
		expect(speechSynthesis.speak).toHaveBeenCalled();
	});

	it('ignores speech without the wake word', () => {
		voiceAssistant.start('Hopsti', 'en');
		FakeRecognition.last.say('what can you do');
		expect(displayMessage).not.toHaveBeenCalled();
	});

	it('takes the next utterance as the command after a bare wake word', () => {
		voiceAssistant.start('Hopsti', 'en');
		FakeRecognition.last.say('Hopsti');
		expect(lastReply()).toBe('voice_assistant.reply_wake');
		FakeRecognition.last.say('help');
		expect(lastReply()).toBe('voice_assistant.reply_help');
	});

	it('does not answer its own spoken reply', () => {
		voiceAssistant.start('Hopsti', 'en');
		vi.spyOn(speechSynthesis, 'speaking', 'get').mockReturnValue(true);
		FakeRecognition.last.say('Hopsti, what can you do?');
		expect(displayMessage).not.toHaveBeenCalled();
	});

	it('restarts after the engine ends, but not while suspended', () => {
		voiceAssistant.start('Hopsti', 'en');
		const r = FakeRecognition.last;
		r.onend?.();
		vi.advanceTimersByTime(400);
		expect(r.start).toHaveBeenCalledTimes(2);

		voiceAssistant.suspend();
		vi.advanceTimersByTime(400);
		expect(r.start).toHaveBeenCalledTimes(2);
		voiceAssistant.release();
		expect(r.start).toHaveBeenCalledTimes(3);
	});

	it('gives up when the microphone is denied', () => {
		voiceAssistant.start('Hopsti', 'en');
		const r = FakeRecognition.last;
		r.onerror?.({ error: 'not-allowed' });
		r.onend?.();
		vi.advanceTimersByTime(400);
		expect(voiceAssistant.blocked).toBe(true);
		expect(r.start).toHaveBeenCalledTimes(1);
	});
});
