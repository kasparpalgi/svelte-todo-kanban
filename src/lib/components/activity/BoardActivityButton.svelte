<!-- @file src/lib/components/activity/BoardActivityButton.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Activity } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	let { onclick }: { onclick: () => void } = $props();
</script>

<Button variant="outline" size="sm" {onclick}>
	<Activity class="mr-2 h-4 w-4" />
	<span class="hidden md:block">{$t('activity.title')}</span>
</Button>
