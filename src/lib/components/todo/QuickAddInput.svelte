<!-- @file src/lib/components/todo/QuickAddInput.svelte -->
<script lang="ts">
	import VoiceInput from './VoiceInput.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { GithubIcon } from 'lucide-svelte';

	let {
		value = $bindable(''),
		autofocus = true,
		onSubmit = (val: string, skipGithub: boolean) => {},
		onCancel = () => {},
		id = `quickadd-${crypto.randomUUID()}`,
		showVoiceButton = true,
		showGithubCheckbox = false
	} = $props();

	let skipGithubIssue = $state(false);

	let inputEl: HTMLInputElement;
	let mounted = false;
	let isListening = $state(false);
	let hasUserInteracted = $state(false);

	$effect(() => {
		mounted = true;
		return () => {
			mounted = false;
		};
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			onSubmit(value.trim(), skipGithubIssue);
			skipGithubIssue = false; // Reset after submit
		} else if (event.key === 'Escape') {
			onCancel();
		}
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
		isListening = false;
	}

	$effect(() => {
		if (autofocus && inputEl && mounted && !isListening && !hasUserInteracted) {
			requestAnimationFrame(() => {
				inputEl?.focus?.();
			});
		}
	});

	$effect(() => {
		if (!isListening && inputEl && mounted && hasUserInteracted) {
			requestAnimationFrame(() => {
				inputEl?.focus?.();
			});
		}
	});

	function handleVoiceTranscript(transcript: string) {
		value = transcript;
		isListening = true;
		hasUserInteracted = true;
	}
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

	{#if showGithubCheckbox}
		<label class="flex items-center gap-2 text-xs cursor-pointer">
			<input
				type="checkbox"
				bind:checked={skipGithubIssue}
				class="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
			/>
			<GithubIcon class="h-3 w-3" />
			<span>Do not create GitHub issue</span>
		</label>
	{/if}
</div>
