<!-- @file src/lib/components/todo/KanbanColumn_neodrag.svelte -->
<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Plus } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import TodoItemNeodrag from './TodoItem_neodrag.svelte';
	import QuickAddInput from './QuickAddInput.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { t } from '$lib/i18n';

	let {
		list,
		todos,
		draggedTodo,
		dropTarget,
		onDragStart,
		onDragEnd,
		onDelete
	}: {
		list: { id: string; name: string };
		todos: TodoFieldsFragment[];
		draggedTodo: TodoFieldsFragment | null;
		dropTarget: {
			listId: string;
			index: number;
			position: 'above' | 'below';
		} | null;
		onDragStart: (todo: TodoFieldsFragment) => void;
		onDragEnd: () => void;
		onDelete: (todoId: string) => void;
	} = $props();

	let showTopInput = $state(false);
	let showBottomInput = $state(false);
	let topInputValue = $state('');
	let bottomInputValue = $state('');

	async function handleTopSubmit(title: string) {
		if (!title.trim()) return;

		const result = await todosStore.createTodo({
			title: title.trim(),
			list_id: list.id === 'inbox' ? null : list.id,
			sort_order: 0 // Insert at top
		});

		if (result.success) {
			topInputValue = '';
			showTopInput = false;
			displayMessage($t('todo.create_success'), 1500, true);
		} else {
			displayMessage(result.message || $t('todo.create_failed'));
		}
	}

	async function handleBottomSubmit(title: string) {
		if (!title.trim()) return;

		const result = await todosStore.createTodo({
			title: title.trim(),
			list_id: list.id === 'inbox' ? null : list.id,
			sort_order: todos.length + 1 // Insert at bottom
		});

		if (result.success) {
			bottomInputValue = '';
			displayMessage($t('todo.create_success'), 1500, true);
		} else {
			displayMessage(result.message || $t('todo.create_failed'));
		}
	}
</script>

<Card data-list-id={list.id} class="flex flex-col">
	<CardHeader>
		<CardTitle class="text-sm font-medium">{list.name}</CardTitle>
		<CardDescription class="text-xs">
			{todos.length}
			{todos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
		</CardDescription>
	</CardHeader>
	<CardContent class="flex-grow space-y-2">
		<!-- Quick add at top -->
		{#if showTopInput}
			<QuickAddInput
				bind:value={topInputValue}
				onSubmit={handleTopSubmit}
				onCancel={() => {
					showTopInput = false;
					topInputValue = '';
				}}
				showVoiceButton={false}
			/>
		{:else}
			<Button
				variant="ghost"
				size="sm"
				class="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
				onclick={() => (showTopInput = true)}
			>
				<Plus class="mr-1 h-3 w-3" />
				{$t('todo.add_to_top')}
			</Button>
		{/if}

		{#each todos as todo, idx (todo.id)}
			{@const isDropTargetInThisList = dropTarget?.listId === list.id}
			{@const sourceListId = draggedTodo?.list?.id || 'inbox'}
			{@const isSameList = isDropTargetInThisList && sourceListId === list.id}
			{@const isDraggedCard = draggedTodo?.id === todo.id}
			{@const targetIndex = dropTarget?.index ?? -1}

			<!-- Calculate which index this card is at in the filtered list (for same-list) -->
			{@const filteredIndex =
				isSameList && draggedTodo
					? todos.filter((t) => t.id !== draggedTodo.id).findIndex((t) => t.id === todo.id)
					: idx}

			{@const isTargetedDirectlyAbove =
				isDropTargetInThisList && targetIndex === filteredIndex && dropTarget?.position === 'above'}

			{@const isTargetedBelowPrevious =
				isDropTargetInThisList &&
				targetIndex === filteredIndex - 1 &&
				dropTarget?.position === 'below'}

			{@const showAbove = isTargetedDirectlyAbove || isTargetedBelowPrevious}

			<TodoItemNeodrag
				{todo}
				{draggedTodo}
				isDragging={isDraggedCard}
				showDropAbove={showAbove}
				listId={list.id}
				{onDragStart}
				{onDragEnd}
				{onDelete}
			/>
		{/each}

		<!-- Show drop indicator at the end of the list -->
		{#if dropTarget?.listId === list.id}
			{@const sourceListId = draggedTodo?.list?.id || 'inbox'}
			{@const isSameList = sourceListId === list.id}
			{@const filteredLength =
				isSameList && draggedTodo
					? todos.filter((t) => t.id !== draggedTodo.id).length
					: todos.length}

			{@const isTargetingBelowLastItem =
				dropTarget.index === filteredLength - 1 && dropTarget.position === 'below'}
			{@const isTargetingEmptyListSpace = dropTarget.index >= filteredLength}

			{#if isTargetingBelowLastItem || isTargetingEmptyListSpace}
				<div class="h-1 rounded bg-primary shadow-lg shadow-primary/50"></div>
			{/if}
		{/if}

		<!-- Quick add at bottom -->
		{#if showBottomInput}
			<QuickAddInput
				bind:value={bottomInputValue}
				onSubmit={handleBottomSubmit}
				onCancel={() => {
					showBottomInput = false;
					bottomInputValue = '';
				}}
				showVoiceButton={false}
			/>
		{:else}
			<Button
				variant="ghost"
				size="sm"
				class="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
				onclick={() => (showBottomInput = true)}
			>
				<Plus class="mr-1 h-3 w-3" />
				{$t('todo.add_to_bottom')}
			</Button>
		{/if}
	</CardContent>
</Card>
