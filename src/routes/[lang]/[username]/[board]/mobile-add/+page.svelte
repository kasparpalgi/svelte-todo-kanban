<!-- @file: src/routes/[lang]/[username]/[board]/mobile-add/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte.js';
	import VoiceInput from '$lib/components/todo/VoiceInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { t } from '$lib/i18n';

	let transcribedText = $state('');
	let isRecording = $state(false);
	let selectedBoardId = $state('');
	let selectedListId = $state('');
	let availableLists = $derived(listsStore.lists.filter((l) => l.board_id === selectedBoardId));

	onMount(async () => {
		await listsStore.loadBoards();
		await listsStore.loadLists();

		const board = listsStore.boards.find((b) => b.alias === page.params.board);
		if (board) {
			selectedBoardId = board.id;
		}
	});

	$effect(() => {
		if (selectedBoardId) {
			const boardLists = listsStore.lists
				.filter((l) => l.board_id === selectedBoardId)
				.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
			if (boardLists.length > 0) {
				selectedListId = boardLists[0].id;
			} else {
				selectedListId = '';
			}
		}
	});

	function handleTranscript(transcript: string) {
		transcribedText = transcript;
		isRecording = true;
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
		isRecording = false;
	}

	async function addTodo() {
		if (!transcribedText.trim() || !selectedListId) {
			displayMessage($t('todo.record_message_prompt'), 3000, false);
			return;
		}

		const result = await todosStore.addTodo(transcribedText.trim(), undefined, selectedListId);
		if (result.success) {
			transcribedText = '';
			displayMessage($t('todo.todo_added'), 3000, true);
		} else {
			displayMessage($t('todo.error_adding_todo') + result.message);
		}
	}
</script>

<svelte:head>
	<title>{$t('todo.quick_add_board')}</title>
</svelte:head>

<div class="p-4">
	<h1 class="mb-4 text-2xl font-bold">{$t('todo.quick_add_board')}</h1>

	<div class="mb-4">
		<VoiceInput
			onTranscript={handleTranscript}
			onError={handleVoiceError}
			startAutomatically={true}
		/>
	</div>

	{#if transcribedText}
		<div class="mb-4 rounded-md border p-4">
			<p>{transcribedText}</p>
		</div>
	{/if}

	<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div>
			<label for="board-select" class="mb-1 block text-sm font-medium">{$t('todo.board_label')}</label>
			<select
				id="board-select"
				bind:value={selectedBoardId}
				class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				<option disabled value="">{$t('common.select_board')}</option>
				{#each listsStore.boards as board (board.id)}
					<option value={board.id}>{board.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="list-select" class="mb-1 block text-sm font-medium">{$t('todo.list_label')}</label>
			<select
				id="list-select"
				bind:value={selectedListId}
				disabled={!selectedBoardId || availableLists.length === 0}
				class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				<option disabled value="">{$t('common.select_list')}</option>
				{#each availableLists as list (list.id)}
					<option value={list.id}>{list.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<Button onclick={addTodo} disabled={!transcribedText.trim() || !selectedListId}>
		{$t('todo.add_to_board')}
	</Button>
</div>
