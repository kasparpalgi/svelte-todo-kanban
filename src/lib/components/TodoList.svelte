<!-- @file src/lib/components/TodoList.svelte -->
<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Check } from 'lucide-svelte';
	import {
		DndContext,
		DragOverlay,
		closestCenter,
		KeyboardSensor,
		PointerSensor,
		useSensor,
		type DragEndEvent,
		type DragStartEvent
	} from '@dnd-kit-svelte/core';
	import {
		SortableContext,
		sortableKeyboardCoordinates,
		verticalListSortingStrategy
	} from '@dnd-kit-svelte/sortable';
	import TodoItem from '$lib/components/TodoItem.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let activeId = $state<string | null>(null);
	let activeTodo = $state<TodoFieldsFragment | null>(null);
	let pointerSensor = useSensor(PointerSensor, {
		activationConstraint: {
			distance: 8
		}
	});
	let keyboardSensor = useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates
	});
	let sensors = [pointerSensor, keyboardSensor];

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		activeId = active.id as string;
		activeTodo = todosStore.activeTodos.find((todo) => todo.id === activeId) || null;
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			activeId = null;
			activeTodo = null;
			return;
		}

		const activeIndex = todosStore.activeTodos.findIndex((todo) => todo.id === active.id);
		const overIndex = todosStore.activeTodos.findIndex((todo) => todo.id === over.id);

		if (activeIndex !== overIndex) {
			const newTodos = [...todosStore.activeTodos];
			const [removed] = newTodos.splice(activeIndex, 1);
			newTodos.splice(overIndex, 0, removed);

			for (let i = 0; i < newTodos.length; i++) {
				await todosStore.updateTodo(newTodos[i].id, { sort_order: i + 1 });
			}
		}

		activeId = null;
		activeTodo = null;
	}
</script>

<div class="grid gap-6">
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>{$t('todo.active_tasks')}</CardTitle>
					<CardDescription>
						{todosStore.activeTodos.length}
						{todosStore.activeTodos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
						{$t('todo.remaining')}
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-3">
			{#if todosStore.activeTodos.length > 0}
				<DndContext
					{sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={todosStore.activeTodos.map((todo) => todo.id)}
						strategy={verticalListSortingStrategy}
					>
						{#each todosStore.activeTodos as todo (todo.id)}
							<TodoItem {todo} />
						{/each}
					</SortableContext>

					<DragOverlay>
						{#if activeTodo}
							<TodoItem todo={activeTodo} isDragging={true} />
						{/if}
					</DragOverlay>
				</DndContext>
			{:else}
				<div class="py-8 text-center text-muted-foreground">
					<p class="text-lg">{$t('todo.no_active_tasks')}</p>
					<p class="text-sm">{$t('todo.add_task_to_start')}</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Completed Tasks -->
	{#if todosStore.completedTodos.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Check class="h-5 w-5 text-green-600" />
					{$t('todo.completed_tasks')}
				</CardTitle>
				<CardDescription>
					{todosStore.completedTodos.length}
					{$t('todo.completed')}
					{todosStore.completedTodos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-2">
				{#each todosStore.completedTodos as todo (todo.id)}
					<div
						class="flex items-center gap-3 rounded-lg border p-3 opacity-75 transition-opacity hover:opacity-100"
					>
						<Button
							onclick={() => todosStore.toggleTodo(todo.id)}
							variant="ghost"
							size="sm"
							class="h-6 w-6 rounded-full border-2 border-green-600 bg-green-100 p-0 hover:bg-green-200"
						>
							<Check class="h-3 w-3 text-green-700" />
							<span class="sr-only">{$t('todo.mark_incomplete')}</span>
						</Button>

						<div class="min-w-0 flex-1">
							<h3 class="leading-none font-medium text-muted-foreground line-through">
								{todo.title}
							</h3>
							{#if todo.content}
								<p class="mt-1 text-sm text-muted-foreground line-through">{todo.content}</p>
							{/if}
							<p class="mt-1 text-xs text-muted-foreground">
								{$t('todo.completed_at')}
								{new Date(todo.completed_at || '').toLocaleDateString()}
							</p>
						</div>
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}
</div>
