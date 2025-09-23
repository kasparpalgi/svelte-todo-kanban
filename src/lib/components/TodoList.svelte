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
	import { Check, Trash2 } from 'lucide-svelte';
	import {
		DndContext,
		DragOverlay,
		closestCenter,
		KeyboardSensor,
		PointerSensor,
		useSensor,
		type DragEndEvent,
		type DragStartEvent,
		type DragMoveEvent
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
	let isDragging = $state(false);
	let dropPosition = $state<{
		todoId: string;
		position: 'above' | 'below';
		targetIndex: number;
	} | null>(null);

	let pointerSensor = useSensor(PointerSensor, {
		activationConstraint: {
			distance: 8
		}
	});
	let keyboardSensor = useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates
	});
	let sensors = [pointerSensor, keyboardSensor];

	let activeTodosArray = $derived(() => {
		return todosStore.todos
			.filter((t) => !t.completed_at)
			.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
	});

	function handleDragStart(event: DragStartEvent) {
		const { active } = event;
		activeId = active.id as string;
		activeTodo =
			activeTodosArray().find((todo: TodoFieldsFragment) => todo.id === activeId) || null;
		isDragging = true;
	}

	function handleDragMove(event: DragMoveEvent) {
		const { active, over } = event;
		if (!over || !active.id) {
			dropPosition = null;
			return;
		}

		const overId = over.id as string;
		const overTodo = activeTodosArray().find((t) => t.id === overId);

		if (overTodo) {
			const todoIndex = activeTodosArray().findIndex((t) => t.id === overId);
			if (todoIndex === -1) return;

			const draggingRect = active.rect.translated;
			const overRect = over.rect;
			if (!draggingRect || !overRect) return;

			const overMiddleY = overRect.top + overRect.height / 2;
			const cursorY = draggingRect.top + draggingRect.height / 2;
			const position = cursorY < overMiddleY ? 'above' : 'below';

			dropPosition = { todoId: overId, position, targetIndex: todoIndex };
		}
	}

	function handleDragCancel() {
		cleanup();
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			cleanup();
			return;
		}

		const activeIndex = activeTodosArray().findIndex(
			(todo: TodoFieldsFragment) => todo.id === active.id
		);
		const overIndex = activeTodosArray().findIndex(
			(todo: TodoFieldsFragment) => todo.id === over.id
		);

		if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
			cleanup();
			return;
		}

		const reorderedTodos = [...activeTodosArray()];
		const [movedItem] = reorderedTodos.splice(activeIndex, 1);
		reorderedTodos.splice(overIndex, 0, movedItem);

		try {
			await Promise.all(
				reorderedTodos.map((todo: TodoFieldsFragment, index: number) =>
					todosStore.updateTodo(todo.id, { sort_order: index + 1 })
				)
			);
		} catch (error) {
			console.error('Failed to update todo order:', error);
			await todosStore.loadTodos();
		}

		cleanup();
	}

	function cleanup() {
		activeId = null;
		activeTodo = null;
		isDragging = false;
		dropPosition = null;
	}

	async function handleDeleteTodo(todoId: string) {
		if (confirm($t('todo.confirm_delete') || 'Are you sure?')) {
			const result = await todosStore.deleteTodo(todoId);
			if (!result.success) {
				alert(result.message);
			}
		}
	}
</script>

<div class="grid gap-3">
	<Card class="border-0 shadow-sm">
		<CardHeader class="px-4 pt-4 pb-2">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base font-medium">{$t('todo.active_tasks')}</CardTitle>
					<CardDescription class="mt-0.5 text-xs">
						{activeTodosArray().length}
						{activeTodosArray().length === 1 ? $t('todo.task') : $t('todo.tasks')}
						{$t('todo.remaining')}
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="px-4 pt-0 pb-4">
			{#if activeTodosArray().length > 0}
				<DndContext
					{sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragMove={handleDragMove}
					onDragEnd={handleDragEnd}
					onDragCancel={handleDragCancel}
				>
					<SortableContext
						items={activeTodosArray().map((todo: TodoFieldsFragment) => todo.id)}
						strategy={verticalListSortingStrategy}
					>
						<div class="space-y-1">
							{#each activeTodosArray() as todo, index (todo.id)}
								{@const isDropTarget = dropPosition?.todoId === todo.id}
								{@const showDropIndicatorAbove = isDropTarget && dropPosition?.position === 'above'}
								{@const showDropIndicatorBelow = isDropTarget && dropPosition?.position === 'below'}

								{#if showDropIndicatorAbove}
									<div
										class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
									></div>
								{/if}

								<TodoItem {todo} />

								{#if showDropIndicatorBelow}
									<div
										class="h-1 w-full rounded-full bg-primary/80 opacity-80 shadow-md shadow-primary/20 transition-all duration-200"
									></div>
								{/if}
							{/each}
						</div>
					</SortableContext>

					<DragOverlay>
						{#if activeTodo}
							<TodoItem todo={activeTodo} isDragging={true} />
						{/if}
					</DragOverlay>
				</DndContext>
			{:else}
				<div class="py-4 text-center text-muted-foreground">
					<p class="text-sm">{$t('todo.no_active_tasks')}</p>
					<p class="mt-1 text-xs">{$t('todo.add_task_to_start')}</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Completed Tasks section remains the same -->
	{#if todosStore.completedTodos.length > 0}
		<Card class="border-0 shadow-sm">
			<CardHeader class="px-4 pt-4 pb-2">
				<CardTitle class="flex items-center gap-2 text-base font-medium">
					<Check class="h-4 w-4 text-green-600" />
					{$t('todo.completed_tasks')}
				</CardTitle>
				<CardDescription class="mt-0.5 text-xs">
					{todosStore.completedTodos.length}
					{$t('todo.completed')}
					{todosStore.completedTodos.length === 1 ? $t('todo.task') : $t('todo.tasks')}
				</CardDescription>
			</CardHeader>
			<CardContent class="px-4 pt-0 pb-4">
				<div class="space-y-1">
					{#each todosStore.completedTodos as todo (todo.id)}
						<div
							class="group relative flex items-center gap-2 rounded-md border p-2 opacity-75 transition-opacity hover:opacity-100"
						>
							<Button
								onclick={() => todosStore.toggleTodo(todo.id)}
								variant="ghost"
								size="sm"
								class="h-5 w-5 shrink-0 rounded-full border-2 border-green-600 bg-green-100 p-0 hover:bg-green-200"
							>
								<Check class="h-2.5 w-2.5 text-green-700" />
								<span class="sr-only">{$t('todo.mark_incomplete')}</span>
							</Button>

							<div class="min-w-0 flex-1 pr-6">
								<h3 class="text-xs leading-tight font-medium text-muted-foreground line-through">
									{todo.title}
								</h3>
								{#if todo.content}
									<p class="mt-0.5 text-xs text-muted-foreground line-through">{todo.content}</p>
								{/if}
								<p class="mt-0.5 text-xs text-muted-foreground">
									{$t('todo.completed_at')}
									{new Date(todo.completed_at || '').toLocaleDateString()}
								</p>
							</div>

							<div
								class="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<Button
									onclick={() => handleDeleteTodo(todo.id)}
									variant="ghost"
									size="sm"
									class="h-5 w-5 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
								>
									<Trash2 class="h-2.5 w-2.5" />
									<span class="sr-only">{$t('todo.delete')}</span>
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
