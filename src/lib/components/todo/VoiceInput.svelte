<!-- @file src/lib/components/todo/VoiceInput.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Mic, Square } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	let {
		onTranscript = (text: string) => {},
		onError = (error: string) => {},
		disabled = false
	} = $props();

	let isRecording = $state(false);
	let isSupported = $state(false);
	let recognition: SpeechRecognition | null = null;
	let interimTranscript = $state('');
	let fullTranscript = $state('');

	onMount(() => {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

		if (SpeechRecognition) {
			isSupported = true;
			recognition = new SpeechRecognition();

			if (recognition) {
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.lang = 'en-GB';

				recognition.onstart = () => {
					isRecording = true;
					interimTranscript = '';
					fullTranscript = '';
				};

				recognition.onresult = (event) => {
					let interim = '';
					let final = '';

					for (let i = event.resultIndex; i < event.results.length; i++) {
						const transcript = event.results[i][0].transcript;
						if (event.results[i].isFinal) {
							final += transcript;
						} else {
							interim += transcript;
						}
					}

					interimTranscript = interim;
					if (final) {
						fullTranscript += final;
					}

					const completeTranscript = (fullTranscript + interim).trim();
					if (completeTranscript) {
						onTranscript(completeTranscript);
					}
				};

				recognition.onerror = (event) => {
					console.error('Speech recognition error:', event.error);
					let errorMessage = 'Speech recognition error';

					switch (event.error) {
						case 'network':
							errorMessage = 'Network error occurred';
							break;
						case 'not-allowed':
							errorMessage = 'Microphone access denied';
							break;
						case 'no-speech':
							errorMessage = 'No speech detected';
							break;
						case 'audio-capture':
							errorMessage = 'No microphone found';
							break;
						default:
							errorMessage = `Speech recognition error: ${event.error}`;
					}

					displayMessage(errorMessage + '. Technical info: ' + event.error);
					onError(errorMessage);
					isRecording = false;
				};

				recognition.onend = () => {
					isRecording = false;
				};
			}
		}
	});

	onDestroy(() => {
		if (recognition && isRecording) {
			recognition.stop();
		}
	});

	function startRecording() {
		if (!recognition || !isSupported) return;

		try {
			recognition.start();
		} catch (error) {
			console.error('Failed to start recording:', error);
			onError('Failed to start recording');
		}
	}

	function stopRecording() {
		if (recognition && isRecording) {
			recognition.stop();
		}
	}

	function toggleRecording() {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}
</script>

{#if isSupported}
	<div class="flex items-center gap-1">
		<button onclick={toggleRecording} {disabled} class="relative">
			{#if isRecording}
				<Square class="mr-1 h-4 w-4" />
				<div class="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
			{:else}
				<Mic class="mr-1 h-4 w-4" />
			{/if}
		</button>

		{#if isRecording && interimTranscript}
			<span class="text-sm text-muted-foreground italic">
				Listening: "{interimTranscript}"
			</span>
		{/if}
	</div>
{:else}
	<div class="text-xs text-muted-foreground">Voice input not supported in this browser</div>
{/if}
