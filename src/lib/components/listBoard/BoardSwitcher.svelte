<!-- @file src/lib/components/listBoard/BoardSwitcher.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Layers, ChevronDown } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';

	$effect(() => {
		if (!listsStore.initialized) listsStore.loadBoards();
	});

	const currentBoardName = $derived(() => listsStore.selectedBoard?.name || '');
</script>

<div class="flex items-center gap-2">
	<Button
		variant="outline"
		size="sm"
		class="h-8"
		onclick={() => (actionState.showBoardSwitcher = true)}
	>
		<Layers class="mr-2 h-4 w-4" />
		{currentBoardName()}
		<ChevronDown class="ml-2 h-4 w-4" />
	</Button>
</div>
