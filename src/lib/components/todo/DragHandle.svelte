<script lang="ts">
	import { GripVertical } from 'lucide-svelte';
	import type { DragHandleProps } from '$lib/types/todo';

	let { attributes, listeners, isVisible = true }: DragHandleProps = $props();
</script>

<button
	class="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity hover:text-foreground active:cursor-grabbing max-md:flex max-md:h-5 max-md:w-5 max-md:items-center max-md:justify-center max-md:rounded max-md:bg-muted/30 max-md:!opacity-100 md:opacity-0 md:group-hover:opacity-100 {isVisible
		? 'md:opacity-100'
		: ''}"
	{...attributes}
	{...listeners}
	data-drag-handle
>
	<GripVertical class="h-3 w-3 max-md:h-4 max-md:w-4" />
</button>
