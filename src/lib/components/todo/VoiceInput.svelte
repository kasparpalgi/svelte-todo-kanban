<!-- @file src/lib/components/todo/VoiceInput.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Mic, Square, RotateCcw, Check, Sparkles } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type {
		SpeechRecognition,
		SpeechRecognitionErrorEvent,
		SpeechRecognitionEvent
	} from '$lib/types/voiceInput';
	import { formatDuration } from '$lib/utils/formatDuration';
	import { formatCost } from '$lib/utils/formatCost';
	import { page } from '$app/stores';

	let {
		onTranscript = (text: string) => {},
		onError = (error: string) => {},
		disabled = false,
		title = '',
		minimal = false,
		startAutomatically = false,
		getContext = () => ({ contentBefore: '', contentAfter: '' }),
		useContextualCorrection = false
	} = $props();

	let user = $derived(userStore.user);
	let autoAICorrect = $derived(user?.settings?.auto_ai_correct || false);
	let aiModel = $derived(user?.settings?.ai_model || 'gpt-5-mini');
	let speechProvider = $derived(
		(user?.settings?.speech_provider as 'browser' | 'groq' | 'whisper') || 'browser'
	);
	let groqApiKey = $derived((user?.settings?.tokens as any)?.groq?.api_key || '');
	let currentLang = $derived($page.params.lang || 'en');
	let isRecording = $state(false);
	let isSupported = $state(false);
	let recognition: SpeechRecognition | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let isTranscribing = $state(false);
	let interimTranscript = $state('');
	let finalTranscript = $state('');
	let isMobile = $state(false);
	let lastFinalResult = $state('');
	let speechSegments = $state<string[]>([]);
	let isProcessingAI = $state(false);
	let originalText = $state('');
	let correctedText = $state('');
	let showRevertButton = $state(false);
	let isAIUndone = $state(false);
	let showAICorrectButton = $state(false);
	let processingTime = $state('');
	let processingCost = $state('');

	function detectMobile(): boolean {
		if (!window.navigator) return false;
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			window.navigator.userAgent
		);
	}

	function removeDuplicates(text: string): string {
		if (!text) return text;

		const words = text.split(/\s+/).filter((word) => word.length > 0);
		const cleaned: string[] = [];

		for (let i = 0; i < words.length; i++) {
			const currentWord = words[i].toLowerCase().trim();
			const lastWord = cleaned.length > 0 ? cleaned[cleaned.length - 1].toLowerCase().trim() : '';

			if (currentWord !== lastWord) {
				cleaned.push(words[i]);
			}
		}

		const result = cleaned.join(' ').trim();

		if (result !== text.trim()) {
			loggingStore.debug('VoiceInput', 'Cleaned duplicates', {
				original: text,
				cleaned: result
			});
		}

		return result;
	}

	async function correctTextWithAI(
		text: string
	): Promise<{ corrected: string; time: string; cost: string }> {
		if (!text.trim()) return { corrected: text, time: '', cost: '' };

		loggingStore.info('VoiceInput', 'Starting AI correction', { text, model: aiModel, useContextualCorrection });

		const startTime = Date.now();

		try {
			const requestBody: any = {
				text: text,
				type: useContextualCorrection ? 'contextual' : 'correct',
				model: aiModel
			};

			// Add context for contextual correction
			if (useContextualCorrection) {
				const context = getContext();
				requestBody.contentBefore = context.contentBefore || '';
				requestBody.contentAfter = context.contentAfter || '';
				requestBody.title = title || '';
			} else if (title) {
				requestBody.context = `Title context: "${title}"`;
			}

			const response = await fetch('/api/ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				throw new Error(`AI correction failed: ${response.status}`);
			}

			const result = await response.json();
			const endTime = Date.now();
			const duration = endTime - startTime;
			const timeStr = formatDuration(duration);

			loggingStore.info('VoiceInput', 'AI correction completed', {
				original: text,
				corrected: result.corrected,
				changed: result.changed,
				duration: timeStr,
				cost: result.cost || 'N/A',
				model: aiModel,
				contextual: useContextualCorrection
			});

			return {
				corrected: result.corrected || text,
				time: timeStr,
				cost: result.cost || 'N/A'
			};
		} catch (error) {
			loggingStore.error('VoiceInput', 'AI correction failed', { error, text });
			return { corrected: text, time: '', cost: '' };
		}
	}

	async function handleAICorrection(text: string) {
		if (!text.trim() || isProcessingAI) return;

		originalText = text;
		showRevertButton = false;
		showAICorrectButton = false;

		if (autoAICorrect) {
			await applyAICorrection(text);
		} else {
			showAICorrectButton = true;
		}
	}

	async function applyAICorrection(text: string) {
		if (!text.trim() || isProcessingAI) return;

		isProcessingAI = true;
		showAICorrectButton = false;

		try {
			const result = await correctTextWithAI(text);
			correctedText = result.corrected;
			processingTime = result.time;
			processingCost = result.cost;

			if (correctedText !== originalText) {
				showRevertButton = true;
				isAIUndone = false;
				onTranscript(correctedText);
				loggingStore.info('VoiceInput', 'Applied AI correction', {
					original: originalText,
					corrected: correctedText,
					time: processingTime,
					cost: processingCost
				});
			} else {
				processingTime = result.time;
				processingCost = result.cost;
			}
		} finally {
			isProcessingAI = false;
		}
	}

	function triggerManualCorrection() {
		if (originalText) {
			applyAICorrection(originalText);
		}
	}

	function revertToOriginal() {
		if (originalText) {
			onTranscript(originalText);
			isAIUndone = true;
			loggingStore.info('VoiceInput', 'Reverted to original text', {
				reverted: originalText,
				wasCorreected: correctedText
			});
		}
	}

	function reapplyAI() {
		if (originalText) {
			onTranscript(correctedText);
			isAIUndone = false;
			loggingStore.info('VoiceInput', 'Re-applied AI correction', {
				reapplied: correctedText,
				original: originalText
			});
		}
	}

	function combineSpeechSegments(): string {
		if (speechSegments.length === 0) return '';

		return speechSegments
			.map((segment) => segment.trim())
			.filter((segment) => segment.length > 0)
			.map((segment) => {
				if (!/[.!?]$/.test(segment)) {
					return segment + '.';
				}
				return segment;
			})
			.join(' ');
	}

	async function transcribeAudio(audioBlob: Blob) {
		isTranscribing = true;
		try {
			const form = new FormData();
			form.append('audio', audioBlob, 'audio.webm');
			form.append('provider', speechProvider);
			if (speechProvider === 'groq') {
				form.append('groqApiKey', groqApiKey);
			}

			const response = await fetch('/api/transcribe', { method: 'POST', body: form });
			if (!response.ok) throw new Error(`Transcription failed: ${response.status}`);

			const data = await response.json();
			const text = (data.text || '').trim();
			if (text) {
				finalTranscript = text;
				onTranscript(text);
				await handleAICorrection(text);
			}
		} catch (error) {
			loggingStore.error('VoiceInput', 'Transcription failed', { error });
			displayMessage('Transcription failed. Please try again.');
			onError('Transcription failed');
		} finally {
			isTranscribing = false;
		}
	}

	async function startMediaRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const chunks: Blob[] = [];
			mediaRecorder = new MediaRecorder(stream);

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunks.push(e.data);
			};

			mediaRecorder.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				const blob = new Blob(chunks, { type: 'audio/webm' });
				await transcribeAudio(blob);
			};

			mediaRecorder.start();
			isRecording = true;
			interimTranscript = '';
			finalTranscript = '';
			showRevertButton = false;
			showAICorrectButton = false;
			isAIUndone = false;
			originalText = '';
			correctedText = '';
			loggingStore.info('VoiceInput', 'Media recording started', { provider: speechProvider });
		} catch (error) {
			loggingStore.error('VoiceInput', 'Failed to start media recording', { error });
			displayMessage('Microphone access denied');
			onError('Microphone access denied');
		}
	}

	function stopMediaRecording() {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop();
			isRecording = false;
		}
	}

	onMount(() => {
		isMobile = detectMobile();
		loggingStore.debug('VoiceInput', 'Component mounted', {
			isMobile,
			userAgent: navigator.userAgent,
			autoAICorrect,
			aiModel
		});

		if (speechProvider === 'groq' || speechProvider === 'whisper') {
			isSupported = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
			if (!isSupported) {
				loggingStore.warn('VoiceInput', 'MediaRecorder not supported', {
					userAgent: navigator.userAgent
				});
			}
			return;
		}

		const SpeechRecognition =
			(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

		if (SpeechRecognition) {
			isSupported = true;
			recognition = new SpeechRecognition();

			if (recognition) {
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.lang = 'en-GB';
				recognition.maxAlternatives = 1;

				recognition.onstart = () => {
					isRecording = true;
					interimTranscript = '';
					finalTranscript = '';
					lastFinalResult = '';
					speechSegments = [];
					showRevertButton = false;
					showAICorrectButton = false;
					isAIUndone = false;
					originalText = '';
					correctedText = '';
					processingTime = '';
					processingCost = '';
					loggingStore.info('VoiceInput', 'Speech recognition started');
				};

				recognition.onresult = (event: SpeechRecognitionEvent) => {
					loggingStore.debug('VoiceInput', 'onresult called', {
						resultIndex: event.resultIndex,
						resultsLength: event.results.length,
						isMobile
					});

					let interimText = '';
					let finalText = '';

					for (let i = event.resultIndex; i < event.results.length; i++) {
						const result = event.results[i];
						const transcript = result[0].transcript;
						const confidence = result[0].confidence;

						if (result.isFinal) {
							const shouldAccept = isMobile ? confidence > 0 : true;

							if (shouldAccept) {
								finalText += transcript;
							}
						} else {
							interimText += transcript;
						}
					}

					if (interimText !== interimTranscript) {
						interimTranscript = interimText;
					}

					if (finalText) {
						const cleanedFinal = removeDuplicates(finalText);

						if (cleanedFinal && cleanedFinal !== lastFinalResult) {
							speechSegments.push(cleanedFinal);
							lastFinalResult = cleanedFinal;

							const combinedText = combineSpeechSegments();
							finalTranscript = combinedText;

							onTranscript(combinedText);
						}
					}
				};

				recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
					loggingStore.error('VoiceInput', 'Speech recognition error', {
						error: event.error,
						message: event.message,
						isMobile
					});

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
						case 'service-not-allowed':
							errorMessage = 'Speech service not allowed';
							break;
						case 'bad-grammar':
							errorMessage = 'Grammar error';
							break;
						case 'language-not-supported':
							errorMessage = 'Language not supported';
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
					loggingStore.info('VoiceInput', 'Speech recognition ended', {
						finalTranscript,
						speechSegments: speechSegments.length
					});

					if (finalTranscript.trim()) {
						setTimeout(() => {
							handleAICorrection(finalTranscript);
						}, 100);
					}
				};
			}
		} else {
			loggingStore.warn('VoiceInput', 'Speech recognition not supported', {
				userAgent: navigator.userAgent
			});
		}

		if (startAutomatically && isSupported) {
			setTimeout(() => {
				if (!isRecording) {
					startRecording();
				}
			}, 300);
		}
	});

	onDestroy(() => {
		if (speechProvider === 'browser') {
			if (recognition && isRecording) recognition.stop();
		} else {
			if (mediaRecorder && isRecording) mediaRecorder.stop();
		}
	});

	function startRecording() {
		if (!isSupported) return;

		if (speechProvider === 'groq' || speechProvider === 'whisper') {
			startMediaRecording();
			return;
		}

		if (!recognition) return;
		try {
			recognition.start();
		} catch (error) {
			loggingStore.error('VoiceInput', 'Failed to start recording', { error });
			onError('Failed to start recording');
		}
	}

	function stopRecording() {
		if (speechProvider === 'groq' || speechProvider === 'whisper') {
			stopMediaRecording();
		} else if (recognition && isRecording) {
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
	<div class="flex flex-col gap-1 self-start">
		<div class="flex items-center gap-1">
			<div class="relative">
				<button
					onclick={toggleRecording}
					{disabled}
					class="relative rounded p-1 transition-colors hover:bg-muted"
					title={isRecording ? 'Stop recording' : 'Start voice input'}
				>
					{#if isRecording}
						<Square class="h-4 w-4 text-red-600" />
						<div
							class="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-red-500"
						></div>
					{:else}
						<Mic class="h-4 w-4 text-muted-foreground hover:text-foreground" />
					{/if}
				</button>
			</div>

			<div class="flex items-center gap-1">
				{#if isTranscribing}
					<div class="flex items-center gap-1 text-sm text-purple-600">
						<div
							class="h-3 w-3 animate-spin rounded-full border border-purple-600 border-t-transparent"
						></div>
					</div>
				{/if}
				{#if isProcessingAI}
					<div class="flex items-center gap-1 text-sm text-blue-600">
						<div
							class="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"
						></div>
					</div>
				{/if}

				{#if showAICorrectButton && !autoAICorrect}
					<button
						onclick={triggerManualCorrection}
						class="rounded bg-blue-100 p-1 text-blue-800 transition-colors hover:bg-blue-200"
						title="Apply AI correction"
					>
						<Sparkles class="h-3 w-3" />
					</button>
				{/if}

				{#if showRevertButton}
					{#if isAIUndone}
						<button
							onclick={reapplyAI}
							class="rounded bg-green-100 p-1 text-green-800 transition-colors hover:bg-green-200"
							title="Redo AI changes"
						>
							<Check class="h-3 w-3" />
						</button>
					{:else}
						<button
							onclick={revertToOriginal}
							class="rounded bg-orange-100 p-1 text-orange-800 transition-colors hover:bg-orange-200"
							title="Undo AI changes"
						>
							<RotateCcw class="h-3 w-3" />
						</button>
					{/if}
				{/if}
			</div>
		</div>

		{#if (processingTime && processingCost) || (showRevertButton && processingTime)}
			<div class="text-xs text-gray-400">
				{processingTime} {formatCost(processingCost, currentLang)}
			</div>
		{/if}
	</div>
{/if}
