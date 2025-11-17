<!-- @file src/lib/components/notes/NoteItem.svelte -->
<script lang="ts">
	import { StickyNote, ChevronRight, ChevronDown, Plus } from 'lucide-svelte';
	import { t } from '$lib/i18n';
	import { notesStore } from '$lib/stores/notes.svelte';

	type Note = {
		id: string;
		title: string;
		content: string | null;
		cover_image_url: string | null;
		updated_at: string;
		parent_id?: string | null;
		subnotes?: Note[];
	};

	let {
		note,
		isSelected = false,
		onclick,
		onAddSubnote
	}: {
		note: Note;
		isSelected?: boolean;
		onclick: () => void;
		onAddSubnote?: (parentId: string) => void;
	} = $props();

	const hasSubnotes = $derived((note.subnotes?.length || 0) > 0);
	const isExpanded = $derived(notesStore.isNoteExpanded(note.id));

	function truncateContent(content: string | null, maxLength: number = 60): string {
		if (!content) return '';
		const textContent = content.replace(/<[^>]*>/g, '').trim();
		return textContent.length > maxLength
			? textContent.substring(0, maxLength) + '...'
			: textContent;
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<div class="group relative">
	<button
		type="button"
		{onclick}
		class="w-full rounded-lg p-3 text-left transition-colors hover:bg-muted {isSelected
			? 'bg-muted'
			: ''}"
	>
		<div class="flex gap-2">
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-start gap-2">
					{#if hasSubnotes}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								notesStore.toggleNoteExpanded(note.id);
							}}
							class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform hover:text-foreground"
							aria-label={isExpanded ? 'Collapse subnotes' : 'Expand subnotes'}
						>
							{#if isExpanded}
								<ChevronDown class="h-4 w-4" />
							{:else}
								<ChevronRight class="h-4 w-4" />
							{/if}
						</button>
					{:else}
						<StickyNote class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
					{/if}
					<div class="min-w-0 flex-1">
						<h3 class="truncate text-sm font-medium">
							{note.title || 'Untitled Note'}
						</h3>
					</div>
				</div>
				{#if note.content}
					<p class="mb-1 text-xs text-muted-foreground line-clamp-2">
						{truncateContent(note.content)}
					</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					{formatDate(note.updated_at)}
				</p>
			</div>
			{#if note.cover_image_url}
				<div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded border">
					<img
						src={note.cover_image_url}
						alt="Cover"
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}
		</div>
	</button>

	<!-- Add subnote button - bottom right -->
	{#if onAddSubnote}
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				onAddSubnote(note.id);
			}}
			class="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity hover:bg-primary/20 group-hover:opacity-100"
			title={$t('notes.addNoteUnder')}
			aria-label={$t('notes.addNoteUnder')}
		>
			<Plus class="h-3.5 w-3.5" />
		</button>
	{/if}
</div>
