<!-- @file src/routes/invite/[token]/+page.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<svelte:head>
	<title>ToDzz</title>
</svelte:head>

<div class="flex h-screen w-screen flex-col items-center justify-center gap-3">
	<div
		class="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary"
		aria-hidden="true"
	></div>
	<p class="text-sm text-muted-foreground">{$t('members.accepting_invitation')}</p>
</div>
