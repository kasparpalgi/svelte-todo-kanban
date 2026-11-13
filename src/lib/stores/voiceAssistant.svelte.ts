/** @file src/lib/stores/voiceAssistant.svelte.ts — always-on wake-word listener (#237) */
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import type { TranslationFunction } from 'sveltekit-i18n';
import { t } from '$lib/i18n';
import { displayMessage } from '$lib/stores/errorSuccess.svelte';
import { loggingStore } from '$lib/stores/logging.svelte';
import type { SpeechRecognition, SpeechRecognitionEvent } from '$lib/types/voiceInput';
import { findWakeWord, matchIntent, speechLang } from '$lib/utils/voiceCommands';

/** Errors that will repeat on every restart — stop instead of looping. */
const FATAL = ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'];
/** After a bare wake word, the next utterance is the command for this long. */
const FOLLOW_UP_MS = 8000;

function createVoiceAssistant() {
	const state = $state({ listening: false, blocked: false });
	let recognition: SpeechRecognition | null = null;
	let wanted = false; // the user has it switched on
	let suspended = false; // another mic user (card voice input) has the engine
	let awaitingUntil = 0;
	let deafUntil = 0; // the mic hears our own replies — ignore them
	let wakeWord = '';

	function reply(key: string) {
		const text = (get(t) as TranslationFunction)(key, { wakeWord });
		displayMessage(text, 6000, true);
		// Chrome refuses speak() before any user gesture on the page; the toast still shows.
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = recognition?.lang ?? 'en-US';
		utterance.onend = () => (deafUntil = Date.now() + 1000);
		speechSynthesis.cancel();
		speechSynthesis.speak(utterance);
	}

	function handle(transcript: string) {
		if (speechSynthesis.speaking || Date.now() < deafUntil) return;
		let command = findWakeWord(transcript, wakeWord);
		if (command === null) {
			if (Date.now() > awaitingUntil) return;
			command = transcript;
		}
		const intent = matchIntent(command);
		awaitingUntil = intent === 'wake' ? Date.now() + FOLLOW_UP_MS : 0;
		loggingStore.info('VoiceAssistant', 'Heard command', { transcript, intent });
		reply(`voice_assistant.reply_${intent}`);
	}

	function create(lang: string): SpeechRecognition | null {
		const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!Ctor) return null;
		const r: SpeechRecognition = new Ctor();
		r.continuous = true;
		r.interimResults = false;
		r.lang = speechLang(lang);
		r.onstart = () => (state.listening = true);
		r.onresult = (event: SpeechRecognitionEvent) => {
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) handle(event.results[i][0].transcript);
			}
		};
		r.onerror = (event) => {
			if (!FATAL.includes(event.error)) return;
			state.blocked = true;
			wanted = false;
			loggingStore.info('VoiceAssistant', 'Listening stopped', { error: event.error });
		};
		// The engine stops itself after silence or ~60 s; keep it going while wanted.
		r.onend = () => {
			if (r !== recognition) return; // replaced after a language change
			state.listening = false;
			if (wanted && !suspended) setTimeout(resume, 300);
		};
		return r;
	}

	function resume() {
		if (!wanted || suspended || state.listening || !recognition) return;
		try {
			recognition.start();
		} catch (error) {
			loggingStore.warn('VoiceAssistant', 'Could not start listening', { error });
		}
	}

	/** Start listening for `word`. Safe to call repeatedly (settings or locale change). */
	function start(word: string, lang: string) {
		if (!browser) return;
		wakeWord = word;
		const speechTag = speechLang(lang);
		if (recognition && recognition.lang !== speechTag) stop();
		recognition ??= create(lang);
		if (!recognition) return;
		wanted = true;
		state.blocked = false;
		resume();
	}

	function stop() {
		wanted = false;
		recognition?.stop();
		recognition = null;
		state.listening = false;
	}

	/** Lend the microphone to another speech feature, then take it back. */
	function suspend() {
		suspended = true;
		recognition?.stop();
	}

	function release() {
		suspended = false;
		resume();
	}

	return {
		get listening() {
			return state.listening;
		},
		get blocked() {
			return state.blocked;
		},
		get supported() {
			return (
				browser && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
			);
		},
		start,
		stop,
		suspend,
		release
	};
}

export const voiceAssistant = createVoiceAssistant();
