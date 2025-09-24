<script lang="ts">
	import { PUBLIC_FULL_CARD_DRAGGABLE } from '$env/static/public';
	import { GripVertical } from 'lucide-svelte';
	import type { DragHandleProps } from '$lib/types/todo';

	let { attributes, listeners, isVisible = true }: DragHandleProps = $props();

	const enableFullCardDrag = PUBLIC_FULL_CARD_DRAGGABLE === 'true';
</script>

{#if enableFullCardDrag}
	<!-- Visual drag indicator when full card draggable -->
	<div
		class="mt-0.5 text-muted-foreground opacity-0 transition-opacity max-md:!opacity-100 md:opacity-0 md:group-hover:opacity-100 {isVisible
			? 'md:opacity-100'
			: ''}"
	>
		<GripVertical class="h-3 w-3 max-md:h-4 max-md:w-4" />
	</div>
{:else}
	<!-- Drag handle in handle mode -->
	<button
		class="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity hover:text-foreground active:cursor-grabbing max-md:flex max-md:h-5 max-md:w-5 max-md:items-center max-md:justify-center max-md:rounded max-md:bg-muted/30 max-md:!opacity-100 md:opacity-0 md:group-hover:opacity-100 {isVisible
			? 'md:opacity-100'
			: ''}"
		{...attributes}
		{...listeners}
	>
		<GripVertical class="h-3 w-3 max-md:h-4 max-md:w-4" />
	</button>
{/if}
