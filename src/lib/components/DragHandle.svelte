<!-- @file src/lib/components/DragHandle.svelte -->
<script lang="ts">
	import { GripVertical } from 'lucide-svelte';
	import { PUBLIC_FULL_CARD_DRAGGABLE } from '$env/static/public';

	type Props = {
		attributes: Record<string, any>;
		listeners: Record<string, any>;
	};

	let { attributes, listeners }: Props = $props();

	const enableFullCardDrag = PUBLIC_FULL_CARD_DRAGGABLE === 'true';
</script>

{#if enableFullCardDrag}
	<!-- Visual drag indicatorwhen full card draggable -->
	<div class="mt-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
		<GripVertical class="h-3 w-3" />
	</div>
{:else}
	<!-- Drag handle in handle mode -->
	<button
		class="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground active:cursor-grabbing"
		{...attributes}
		{...listeners}
	>
		<GripVertical class="h-3 w-3" />
	</button>
{/if}
