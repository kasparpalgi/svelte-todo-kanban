<!-- @file src/lib/components/notes/NoteItem.svelte -->
<script lang="ts">
	import { StickyNote } from 'lucide-svelte';

	type Note = {
		id: string;
		title: string;
		content: string | null;
		cover_image_url: string | null;
		updated_at: string;
	};

	let { note, isSelected = false, onclick }: { note: Note; isSelected?: boolean; onclick: () => void } = $props();

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
				<StickyNote class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
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
