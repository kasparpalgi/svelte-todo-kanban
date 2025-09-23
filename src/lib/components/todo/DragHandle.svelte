<!-- @file src/lib/components/todo/DragHandle.svelte -->
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
		class="mt-0.5 text-muted-foreground transition-opacity {isVisible
			? 'opacity-100'
			: 'opacity-0'}"
	>
		<GripVertical class="h-3 w-3" />
	</div>
{:else}
	<!-- Drag handle in handle mode -->
	<button
		class="mt-0.5 cursor-grab text-muted-foreground transition-opacity hover:text-foreground active:cursor-grabbing {isVisible
			? 'opacity-100'
			: 'opacity-0'}"
		{...attributes}
		{...listeners}
	>
		<GripVertical class="h-3 w-3" />
	</button>
{/if}
