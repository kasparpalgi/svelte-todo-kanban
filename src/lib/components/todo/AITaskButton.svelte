<!-- @file src/lib/components/todo/AITaskButton.svelte -->
<script lang="ts">
	import { Sparkles, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import VoiceInput from './VoiceInput.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { formatDuration } from '$lib/utils/formatDuration';
	import { t } from '$lib/i18n';

	let {
		onResult = (result: string) => {},
		title = '',
		content = '',
		disabled = false,
		minimal = false
	} = $props();

	let user = $derived(userStore.user);
	let aiModel = $derived(user?.settings?.ai_model || 'gpt-5-mini');
	let open = $state(false);
	let taskInput = $state('');
	let isProcessing = $state(false);
	let processingTime = $state('');
	let processingCost = $state('');
	let textareaEl: HTMLTextAreaElement | undefined;

	function handleVoiceTranscript(transcript: string) {
		taskInput = transcript;
		setTimeout(() => {
			if (textareaEl && typeof textareaEl.focus === 'function') {
				textareaEl.focus();
			}
		}, 100);
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
	}

	async function handleSubmitTask() {
		if (!taskInput.trim() || isProcessing) return;

		isProcessing = true;
		const startTime = Date.now();

		try {
			loggingStore.info('AITaskButton', 'Starting AI task', {
				task: taskInput,
				model: aiModel
			});

			const response = await fetch('/api/ai/task', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					task: taskInput,
					title,
					content,
					model: aiModel
				})
			});

			if (!response.ok) {
				throw new Error(`AI task failed: ${response.status}`);
			}

			const result = await response.json();
			const duration = Date.now() - startTime;
			const timeStr = formatDuration(duration);

			processingTime = timeStr;
			processingCost = result.cost || 'N/A';

			loggingStore.info('AITaskButton', 'AI task completed', {
				task: taskInput,
				result: result.result,
				duration: timeStr,
				cost: result.cost,
				model: aiModel
			});

			onResult(result.result || '');
			displayMessage($t('common.success') || 'Task completed', 2000, true);

			// Reset and close
			taskInput = '';
			open = false;
		} catch (error) {
			loggingStore.error('AITaskButton', 'AI task failed', { error, task: taskInput });
			displayMessage('AI task failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
		} finally {
			isProcessing = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			handleSubmitTask();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
	}
</script>

{#if minimal}
	<div class="self-start">
		<button
			onclick={() => (open = true)}
			{disabled}
			class="rounded p-1 transition-colors hover:bg-muted"
			title="AI Task"
			type="button"
		>
			<Sparkles class="h-4 w-4 text-purple-600 hover:text-purple-700" />
		</button>
	</div>
{:else}
	<Button
		variant="outline"
		size="sm"
		onclick={() => (open = true)}
		{disabled}
		class="gap-2"
	>
		<Sparkles class="h-4 w-4 text-purple-600" />
		{$t('ai.task_button') || 'AI Task'}
	</Button>
{/if}

<Dialog bind:open>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-purple-600" />
				{$t('ai.task_title') || 'AI Task'}
			</DialogTitle>
			<DialogDescription>
				{$t('ai.task_description') ||
					'Give AI a task to help with this content. Examples: "Research this topic", "Summarize key points", "Suggest next steps", "Find related information"'}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<div>
				<div class="mb-2 flex items-center justify-between">
					<label for="ai-task-input" class="text-sm font-medium">
						{$t('ai.task_input_label') || 'What should AI do?'}
					</label>
					<VoiceInput
						onTranscript={handleVoiceTranscript}
						onError={handleVoiceError}
						disabled={isProcessing}
						minimal={true}
					/>
				</div>
				<Textarea
					bind:this={textareaEl}
					id="ai-task-input"
					bind:value={taskInput}
					placeholder={$t('ai.task_placeholder') ||
						'e.g., "Research this topic and add key points", "Summarize the content", "Suggest improvements"'}
					class="min-h-[100px]"
					disabled={isProcessing}
					onkeydown={handleKeydown}
				/>
			</div>

			{#if title || content}
				<div class="rounded-md bg-muted p-3 text-xs">
					<p class="font-medium text-muted-foreground">
						{$t('ai.context_info') || 'AI will have access to:'}
					</p>
					<ul class="mt-1 list-inside list-disc text-muted-foreground">
						{#if title}
							<li>{$t('ai.title_context') || 'Title'}: "{title.slice(0, 50)}{title.length >
							50 ? '...' : ''}"</li>
						{/if}
						{#if content}
							<li>
								{$t('ai.content_context') || 'Content'} ({content.length} {$t('ai.characters') ||
									'characters'})
							</li>
						{/if}
					</ul>
				</div>
			{/if}

			<div class="flex items-center justify-between gap-2">
				<div class="text-xs text-muted-foreground">
					{#if processingTime && processingCost}
						{processingTime} • €{processingCost}
					{/if}
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={() => (open = false)} disabled={isProcessing}>
						{$t('common.cancel') || 'Cancel'}
					</Button>
					<Button onclick={handleSubmitTask} disabled={!taskInput.trim() || isProcessing}>
						{#if isProcessing}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{$t('ai.processing') || 'Processing...'}
						{:else}
							<Sparkles class="mr-2 h-4 w-4" />
							{$t('ai.run_task') || 'Run Task'}
						{/if}
					</Button>
				</div>
			</div>

			<p class="text-xs text-muted-foreground">
				{@html $t('ai.keyboard_hint') || 'Press <kbd>Ctrl+Enter</kbd> to submit, <kbd>Esc</kbd> to close'}
			</p>
		</div>
	</DialogContent>
</Dialog>
