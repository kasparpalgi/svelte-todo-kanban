<!-- @file src/lib/components/notes/NotesButton.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { StickyNote } from 'lucide-svelte';
	import { t } from '$lib/i18n';

	let { onclick }: { onclick: () => void } = $props();
</script>

<Button variant="outline" size="sm" {onclick}>
	<StickyNote class="mr-2 h-4 w-4" />
	<span class="hidden md:block">{$t('notes.title')}</span>
</Button>
