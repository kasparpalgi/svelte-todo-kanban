<!-- @file src/lib/components/ui/BoardRedirectLoader.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<div class="flex min-h-[50vh] items-center justify-center">
	<div class="text-center">
		<div
			class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
		></div>
		<p class="text-muted-foreground">Loading your boards...</p>
	</div>
</div>
