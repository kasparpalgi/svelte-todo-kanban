<!-- @file src/lib/components/todo/QuickAddInput.svelte -->
<script lang="ts">
	import VoiceInput from './VoiceInput.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	let {
		value = $bindable(''),
		autofocus = true,
		onSubmit = (val: string) => {},
		onCancel = () => {},
		id = `quickadd-${crypto.randomUUID()}`,
		showVoiceButton = true
	} = $props();

	let inputEl: HTMLInputElement;
	let mounted = false;
	let isListening = $state(false);

	$effect(() => {
		mounted = true;
		return () => {
			mounted = false;
		};
	});

	$effect(() => {
		if (autofocus && inputEl && mounted && !isListening) {
			requestAnimationFrame(() => {
				inputEl?.focus?.();
			});
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			onSubmit(value.trim());
		} else if (event.key === 'Escape') {
			onCancel();
		}
	}

	function handleSubmit() {
		onSubmit(value.trim());
	}

	function handleVoiceTranscript(transcript: string) {
		value = transcript;
		isListening = true;
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
		isListening = false;
	}

	// Focus input if recording stops
	$effect(() => {
		if (!isListening && inputEl && mounted) {
			requestAnimationFrame(() => {
				inputEl?.focus?.();
			});
		}
	});
</script>

<div class="space-y-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-2">
	<div class="flex gap-2">
		<input
			bind:this={inputEl}
			bind:value
			onkeydown={handleKeydown}
			placeholder="Enter task title..."
			class="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			{id}
		/>

		{#if showVoiceButton}
			<VoiceInput onTranscript={handleVoiceTranscript} onError={handleVoiceError} />
		{/if}
	</div>
</div>
