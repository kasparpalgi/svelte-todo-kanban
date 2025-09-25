<!-- @file src/lib/components/todo/VoiceInput.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Mic, Square, RotateCcw, Check } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';

	let {
		onTranscript = (text: string) => {},
		onError = (error: string) => {},
		disabled = false
	} = $props();

	let isRecording = $state(false);
	let isSupported = $state(false);
	let recognition: SpeechRecognition | null = null;
	let interimTranscript = $state('');
	let finalTranscript = $state('');
	let isMobile = $state(false);
	let lastFinalResult = $state('');
	let speechSegments = $state<string[]>([]);
	let isProcessingAI = $state(false);
	let originalText = $state('');
	let correctedText = $state('');
	let showRevertButton = $state(false);
	let isAIUndone = $state(false); // Tracks if AI change has been undone

	function detectMobile(): boolean {
		if (!window.navigator) return false;
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			window.navigator.userAgent
		);
	}

	// Clean duplicate words
	function removeDuplicates(text: string): string {
		if (!text) return text;

		// Split into words & get rid of consecutive duplicates
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

	async function correctTextWithAI(text: string): Promise<string> {
		if (!text.trim()) return text;

		loggingStore.info('VoiceInput', 'Starting AI correction', { text });

		try {
			const response = await fetch('/api/ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: text,
					type: 'correct'
				})
			});

			if (!response.ok) {
				throw new Error(`AI correction failed: ${response.status}`);
			}

			const result = await response.json();

			loggingStore.info('VoiceInput', 'AI correction completed', {
				original: text,
				corrected: result.corrected,
				changed: result.changed
			});

			return result.corrected || text;
		} catch (error) {
			loggingStore.error('VoiceInput', 'AI correction failed', { error, text });
			return text; // Return original text if AI fails
		}
	}

	// Apply AI correction in background
	async function applyAICorrection(text: string) {
		if (!text.trim() || isProcessingAI) return;

		isProcessingAI = true;
		originalText = text;
		showRevertButton = false;

		try {
			correctedText = await correctTextWithAI(text);

			if (correctedText !== originalText) {
				showRevertButton = true;
				isAIUndone = false; // Correction is active, not undone
				onTranscript(correctedText);
				loggingStore.info('VoiceInput', 'Applied AI correction', {
					original: originalText,
					corrected: correctedText
				});
			}
		} finally {
			isProcessingAI = false;
		}
	}

	// Revert to original text
	function revertToOriginal() {
		if (originalText) {
			onTranscript(originalText);
			isAIUndone = true; // Mark AI correction as undone
			loggingStore.info('VoiceInput', 'Reverted to original text', {
				reverted: originalText,
				wasCorreected: correctedText
			});
		}
	}

	// Re-apply AI correction after revert
	function reapplyAI() {
		if (originalText) {
			onTranscript(correctedText);
			isAIUndone = false; // Mark AI correction as active again
			loggingStore.info('VoiceInput', 'Re-applied AI correction', {
				reapplied: correctedText,
				original: originalText
			});
		}
	}

	// Combine speech segments (proper spacing)
	function combineSegments(): string {
		if (speechSegments.length === 0) return '';

		// Join segments with periods & spaces (avoid double periods)
		return speechSegments
			.map((segment) => segment.trim())
			.filter((segment) => segment.length > 0)
			.map((segment) => {
				// Add period if the segment doesn't end with punctuation
				if (!/[.!?]$/.test(segment)) {
					return segment + '.';
				}
				return segment;
			})
			.join(' ');
	}

	onMount(() => {
		isMobile = detectMobile();
		loggingStore.info('VoiceInput', 'Component mounted', {
			isMobile,
			userAgent: navigator.userAgent
		});

		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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
					isAIUndone = false;
					originalText = '';
					correctedText = '';
					loggingStore.info('VoiceInput', 'Speech recognition started');
				};

				recognition.onresult = (event) => {
					loggingStore.debug('VoiceInput', 'onresult called', {
						resultIndex: event.resultIndex,
						resultsLength: event.results.length,
						isMobile
					});

					let interimText = '';
					let finalText = '';

					// Process results starting from resultIndex
					for (let i = event.resultIndex; i < event.results.length; i++) {
						const result = event.results[i];
						const transcript = result[0].transcript;
						const confidence = result[0].confidence;

						loggingStore.debug('VoiceInput', 'Processing result', {
							index: i,
							transcript: transcript,
							confidence: confidence,
							isFinal: result.isFinal,
							isMobile
						});

						if (result.isFinal) {
							const shouldAccept = isMobile ? confidence > 0 : true;

							if (shouldAccept) {
								finalText += transcript;
								loggingStore.debug('VoiceInput', 'Accepted final result', {
									transcript,
									confidence,
									shouldAccept
								});
							} else {
								loggingStore.debug('VoiceInput', 'Rejected final result (zero confidence)', {
									transcript,
									confidence
								});
							}
						} else {
							interimText += transcript;
						}
					}

					if (interimText !== interimTranscript) {
						interimTranscript = interimText;
						loggingStore.debug('VoiceInput', 'Updated interim transcript', { interimText });
					}

					if (finalText) {
						const cleanedFinal = removeDuplicates(finalText);

						if (cleanedFinal && cleanedFinal !== lastFinalResult) {
							speechSegments.push(cleanedFinal);
							lastFinalResult = cleanedFinal;

							// Combine all segments
							const combinedText = combineSegments();
							finalTranscript = combinedText;

							loggingStore.info('VoiceInput', 'New speech segment added', {
								segment: cleanedFinal,
								totalSegments: speechSegments.length,
								combinedText
							});

							onTranscript(combinedText);
						} else {
							loggingStore.debug('VoiceInput', 'Ignored duplicate final result', {
								finalText,
								cleanedFinal,
								lastFinalResult
							});
						}
					}
				};

				recognition.onerror = (event) => {
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

					// Apply AI correction in bg (have final text?)
					if (finalTranscript.trim()) {
						setTimeout(() => {
							applyAICorrection(finalTranscript);
						}, 100);
					}
				};

				recognition.onspeechstart = () => {
					loggingStore.debug('VoiceInput', 'Speech detected');
				};

				recognition.onspeechend = () => {
					loggingStore.debug('VoiceInput', 'Speech ended');
				};

				recognition.onsoundstart = () => {
					loggingStore.debug('VoiceInput', 'Sound detected');
				};

				recognition.onsoundend = () => {
					loggingStore.debug('VoiceInput', 'Sound ended');
				};
			}
		} else {
			loggingStore.warn('VoiceInput', 'Speech recognition not supported', {
				userAgent: navigator.userAgent
			});
		}
	});

	onDestroy(() => {
		loggingStore.debug('VoiceInput', 'Component destroying');

		if (recognition && isRecording) {
			recognition.stop();
		}
	});

	function startRecording() {
		if (!recognition || !isSupported) {
			loggingStore.warn('VoiceInput', 'Cannot start recording - not supported');
			return;
		}

		try {
			loggingStore.info('VoiceInput', 'Starting recording');
			recognition.start();
		} catch (error) {
			loggingStore.error('VoiceInput', 'Failed to start recording', { error });
			console.error('Failed to start recording:', error);
			onError('Failed to start recording');
		}
	}

	function stopRecording() {
		if (recognition && isRecording) {
			loggingStore.info('VoiceInput', 'Stopping recording');
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
	<div class="flex items-center gap-2">
		<div class="relative">
			<button
				onclick={toggleRecording}
				{disabled}
				class="relative rounded p-1 transition-colors hover:bg-muted"
				title={isRecording ? 'Stop recording' : 'Start voice input'}
			>
				{#if isRecording}
					<Square class="h-4 w-4 text-red-600" />
					<div class="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
				{:else}
					<Mic class="h-4 w-4 text-muted-foreground hover:text-foreground" />
				{/if}
			</button>
		</div>

		<!-- AI Processing Loader -->
		{#if isProcessingAI}
			<div class="flex items-center gap-2 text-sm text-blue-600">
				<div
					class="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent"
				></div>
				AI improving...
			</div>
		{/if}

		<!-- Revert/Redo Controls -->
		{#if showRevertButton}
			<div class="flex items-center gap-1">
				{#if isAIUndone}
					<button
						onclick={reapplyAI}
						class="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-800 transition-colors hover:bg-green-200"
						title="Redo AI changes"
					>
						<Check class="h-3 w-3" />
						AI redo
					</button>
				{:else}
					<button
						onclick={revertToOriginal}
						class="flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs text-orange-800 transition-colors hover:bg-orange-200"
						title="Undo AI changes"
					>
						<RotateCcw class="h-3 w-3" />
						AI undo
					</button>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="text-xs text-muted-foreground">Voice input not supported in this browser</div>
{/if}
