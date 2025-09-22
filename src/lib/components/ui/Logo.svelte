<!-- @file src/lib/components/ui/Logo.svelte -->
<script lang="ts">
	import SunIcon from 'lucide-svelte/icons/sun';
	import MoonIcon from 'lucide-svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<Button
	onclick={toggleMode}
	variant="outline"
	size="sm"
	aria-label="Toggle theme"
	class="h-8 w-8 p-0"
>
	<SunIcon size="14" class="scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
	<MoonIcon
		size="14"
		class="absolute scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
	/>
	<span class="sr-only">Toggle theme</span>
</Button>
