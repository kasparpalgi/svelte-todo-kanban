<!-- @file src/lib/components/todo/CardReadOnlyView.svelte -->
<!-- Card detail for board viewers (#239): read everything, comment, nothing else. -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { getPriorityColor, getPriorityLabel } from '$lib/utils/cardHelpers';
	import { formatLocaleDate } from '$lib/utils/dateTime.svelte';
	import { toPlainText } from '$lib/utils/markdown';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { X, Calendar as CalendarIcon } from 'lucide-svelte';
	import CardImageManager from '$lib/components/card/CardImageManager.svelte';
	import CardComments from '$lib/components/card/CardComments.svelte';
	import type { CardDetailViewProps, Priority } from '$lib/types/todo';

	let { todo, lang, onClose }: CardDetailViewProps = $props();

	const priority = $derived(todo.priority as Priority | null);
</script>

<Card class="relative">
	<Button
		variant="ghost"
		size="sm"
		onclick={onClose}
		class="absolute top-2 right-2 z-10 h-7 w-7 p-0"
		aria-label={$t('common.close')}
	>
		<X class="h-3.5 w-3.5" />
	</Button>

	<CardHeader class="pr-12 pb-4">
		<p class="mb-2 text-xs text-muted-foreground">{$t('card.read_only_notice')}</p>
		<div class="mb-3 flex flex-wrap items-center gap-2">
			{#if todo.list}
				<Badge variant="secondary" class="text-xs">{todo.list.name}</Badge>
			{/if}
			{#if priority}
				<Badge class="{getPriorityColor(priority)} text-xs text-white">
					{getPriorityLabel(priority, $t)}
				</Badge>
			{/if}
			{#each todo.labels ?? [] as l (l.label.id)}
				<span class="text-xs font-medium" style:color={l.label.color}>{l.label.name}</span>
			{/each}
			{#each todo.assignees ?? [] as a (a.user_id)}
				<Badge variant="outline" class="text-xs">{a.assignee.name || a.assignee.username}</Badge>
			{/each}
			{#if todo.due_on}
				<span class="flex items-center gap-1 text-xs text-muted-foreground">
					<CalendarIcon class="h-3 w-3" />
					{formatLocaleDate(todo.due_on, lang)}
				</span>
			{/if}
		</div>
		<h2 class="text-lg font-semibold [overflow-wrap:anywhere]">{todo.title}</h2>
	</CardHeader>

	<CardContent class="space-y-6">
		{#if todo.content}
			<p class="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
				{toPlainText(todo.content)}
			</p>
		{/if}

		<CardImageManager
			readOnly
			todoId={todo.id}
			initialImages={todo.uploads?.map((u) => ({
				id: u.id,
				file: null,
				preview: u.url,
				isExisting: true
			})) || []}
		/>

		<CardComments {todo} {lang} readOnly />

		<div class="flex justify-end border-t pt-4">
			<Button variant="outline" onclick={onClose}>{$t('common.close')}</Button>
		</div>
	</CardContent>
</Card>
