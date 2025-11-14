<!-- @file src/lib/components/notes/NotesList.svelte -->
<script lang="ts">
	import { Plus, Search } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n';
	import NoteItem from './NoteItem.svelte';

	type Note = {
		id: string;
		title: string;
		content: string | null;
		updated_at: string;
	};

	let {
		notes,
		selectedNoteId,
		onNoteSelect,
		onCreateNote
	}: {
		notes: Note[];
		selectedNoteId: string | null;
		onNoteSelect: (id: string) => void;
		onCreateNote: () => void;
	} = $props();

	let searchQuery: string = $state('');

	const filteredNotes = $derived(
		notes.filter(
			(note) =>
				note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.content?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="flex h-full flex-col border-r bg-background">
	<!-- Header -->
	<div class="border-b p-4">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold">{$t('notes.title')}</h2>
			<Button size="sm" onclick={onCreateNote}>
				<Plus class="h-4 w-4" />
			</Button>
		</div>
		<div class="relative">
			<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder={$t('notes.searchPlaceholder')}
				bind:value={searchQuery}
				class="pl-8"
			/>
		</div>
	</div>

	<!-- Notes List -->
	<div class="flex-1 overflow-y-auto p-2">
		{#if filteredNotes.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<p class="text-sm text-muted-foreground">
					{searchQuery ? 'No notes found' : $t('notes.noNotes')}
				</p>
				{#if !searchQuery}
					<Button variant="ghost" size="sm" onclick={onCreateNote} class="mt-2">
						<Plus class="mr-2 h-4 w-4" />
						{$t('notes.newNote')}
					</Button>
				{/if}
			</div>
		{:else}
			<div class="space-y-1">
				{#each filteredNotes as note (note.id)}
					<NoteItem
						{note}
						isSelected={selectedNoteId === note.id}
						onclick={() => onNoteSelect(note.id)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
