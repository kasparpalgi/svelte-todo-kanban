<!-- @file src/lib/components/todo/TodoKanban.svelte -->
<script lang="ts">
	import { scale } from 'svelte/transition';
	import { t } from '$lib/i18n';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { todoFilteringStore } from '$lib/stores/todoFiltering.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Plus, RefreshCw, ChevronDown } from 'lucide-svelte';
	import KanbanColumn from './KanbanColumn.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let draggedTodo = $state<TodoFieldsFragment | null>(null);
	let dropTarget = $state<{
		listId: string;
		index: number;
		position: 'above' | 'below';
	} | null>(null);
	let completedItemsToShow = $state(10);
	const completedItemsInitially = 10;
	let scrollContainer: HTMLElement;
	let scrollInterval: number | null = null;

	$effect(() => {
		if (!listsStore.initialized) {
			listsStore.loadLists();
			listsStore.loadBoards();
		}
	});

	$effect(() => {
		if (listsStore.selectedBoard?.id !== todoFilteringStore.filters.boardId) {
			todoFilteringStore.setFilter('boardId', listsStore.selectedBoard?.id || null);
		}
	});

	let kanbanLists = $derived(() => {
		const todosByListId = todoFilteringStore.getTodosByList(todosStore.todos);
		const result = [];

		const inboxTodos = todosByListId.get('inbox');
		if (inboxTodos && inboxTodos.length > 0) {
			const filteredInboxTodos = listsStore.selectedBoard
				? inboxTodos.filter((todo) => {
						return !todo.list || !todo.list.board?.id;
					})
				: inboxTodos;

			if (filteredInboxTodos.length > 0) {
				result.push({
					list: {
						id: 'inbox',
						name: $t('todo.inbox'),
						sort_order: -1
					},
					todos: filteredInboxTodos
				});
			}
		}

		const filteredLists = listsStore.selectedBoard
			? listsStore.sortedLists.filter((l) => l.board_id === listsStore.selectedBoard?.id)
			: listsStore.sortedLists;

		for (const list of filteredLists) {
			result.push({
				list: list,
				todos: todosByListId.get(list.id) || []
			});
		}

		return result;
	});

	let filteredCompletedTodos = $derived(() => {
		const completedTodos = todoFilteringStore.getCompletedTodos(todosStore.todos);

		let filtered = !listsStore.selectedBoard
			? completedTodos
			: completedTodos.filter((todo) => {
					if (!todo.list) {
						return true;
					}
					return todo.list.board?.id === listsStore.selectedBoard?.id;
				});

		return filtered.sort((a, b) => {
			const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
			const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
			return dateB - dateA;
		});
	});

	let visibleCompletedTodos = $derived(() => {
		return filteredCompletedTodos().slice(0, completedItemsToShow);
	});

	let hasMoreCompletedTodos = $derived(() => {
		return filteredCompletedTodos().length > completedItemsToShow;
	});

	async function toggleTodoCompletion(todoId: string) {
		const result = await todosStore.toggleTodo(todoId);
		if (!result.success) {
			displayMessage($t('todo.failed_to_mark_completed'));
		}
	}

	function loadMoreCompletedTodos() {
		completedItemsToShow += completedItemsInitially;
	}

	let dragStartTime = $state(0);

	function handleDragStart(todo: TodoFieldsFragment) {
		draggedTodo = todo;
		dropTarget = null;
		dragStartTime = Date.now();
	}

	function handleDragOver(listId: string, index: number, position: 'above' | 'below') {
		if (!draggedTodo) return;
		dropTarget = { listId, index, position };
	}

	function stopAutoScroll() {
		if (scrollInterval) {
			clearInterval(scrollInterval);
			scrollInterval = null;
		}
	}

	function startAutoScroll(direction: 'left' | 'right') {
		stopAutoScroll();
		const scrollSpeed = 15;
		scrollInterval = setInterval(() => {
			if (scrollContainer) {
				if (direction === 'left') {
					scrollContainer.scrollLeft -= scrollSpeed;
				} else {
					scrollContainer.scrollLeft += scrollSpeed;
				}
			}
		}, 20);
	}

	function handleAutoScroll(clientX: number) {
		if (!scrollContainer || !draggedTodo) {
			stopAutoScroll();
			return;
		}

		const rect = scrollContainer.getBoundingClientRect();
		const hotZoneWidth = 60; // 60px from the edge

		if (clientX > rect.right - hotZoneWidth) {
			startAutoScroll('right');
		} else if (clientX < rect.left + hotZoneWidth) {
			startAutoScroll('left');
		} else {
			stopAutoScroll();
		}
	}

	async function handleDragEnd() {
		stopAutoScroll();
		dragStartTime = 0;
		const hadDraggedTodo = !!draggedTodo;
		const hadDropTarget = !!dropTarget;

		if (draggedTodo && dropTarget) {
			const sourceListId = draggedTodo.list?.id || 'inbox';
			const { listId: targetListId, index: targetIndex, position } = dropTarget;

			if (sourceListId === targetListId) {
				const listGroup = kanbanLists().find((g) => g.list.id === sourceListId);
				if (listGroup) {
					const currentList = [...listGroup.todos];
					const draggedIndex = currentList.findIndex((t) => t.id === draggedTodo!.id);

					let insertionIndex = targetIndex;
					if (position === 'below') {
						insertionIndex++;
					}

					if (insertionIndex === draggedIndex) {
						draggedTodo = null;
						dropTarget = null;
						return;
					}

					const [movedItem] = currentList.splice(draggedIndex, 1);
					currentList.splice(insertionIndex, 0, movedItem);

					const todoId = draggedTodo.id;
					draggedTodo = null;
					dropTarget = null;

					await Promise.all(
						currentList.map((todo, index) =>
							todosStore.updateTodo(todo.id, { sort_order: index + 1 })
						)
					).catch((err) => console.error('Failed to update order:', err));

					return;
				}
			} else {
				const sourceListGroup = kanbanLists().find((g) => g.list.id === sourceListId);
				const targetListGroup = kanbanLists().find((g) => g.list.id === targetListId);

				if (sourceListGroup && targetListGroup) {
					const sourceList = [...sourceListGroup.todos];
					const targetList = [...targetListGroup.todos];
					const listIdToUpdate = targetListId === 'inbox' ? null : targetListId;
					const activeIndex = sourceList.findIndex((t) => t.id === draggedTodo!.id);

					let finalIndex = targetIndex;
					if (position === 'below') {
						finalIndex++;
					}

					const [movedItem] = sourceList.splice(activeIndex, 1);
					targetList.splice(finalIndex, 0, movedItem);

					const todoId = draggedTodo.id;
					draggedTodo = null;
					dropTarget = null;

					const sourceUpdates = sourceList.map((todo, index) =>
						todosStore.updateTodo(todo.id, { sort_order: index + 1 })
					);
					const targetUpdates = targetList.map((todo, index) => {
						const updates: { sort_order: number; list_id?: string | null } = {
							sort_order: index + 1
						};
						if (todo.id === todoId) updates.list_id = listIdToUpdate;
						return todosStore.updateTodo(todo.id, updates);
					});
					await Promise.all([...sourceUpdates, ...targetUpdates]).catch((err) =>
						console.error('Failed to update:', err)
					);

					return;
				}
			}
		}

		if (hadDraggedTodo || hadDropTarget) {
			draggedTodo = null;
			dropTarget = null;
		}
	}

	function updateDropTarget(clientX: number, clientY: number) {
		if (!draggedTodo) return;

		const elements = document.elementsFromPoint(clientX, clientY);
		let foundValidTarget = false;

		for (const el of elements) {
			const cardEl = el.closest('[data-todo-id]');
			if (!cardEl) continue;

			const todoId = cardEl.getAttribute('data-todo-id');
			if (todoId === draggedTodo!.id) continue;

			const listEl = cardEl.closest('[data-list-id]');
			if (listEl) {
				const listId = listEl.getAttribute('data-list-id')!;
				const rect = cardEl.getBoundingClientRect();
				const mouseY = clientY;

				const position = mouseY < rect.top + rect.height / 2 ? 'above' : 'below';

				const sourceListId = draggedTodo!.list?.id || 'inbox';
				const allCards = Array.from(listEl.querySelectorAll('[data-todo-id]'));

				let index: number;
				if (listId === sourceListId) {
					const filteredCards = allCards.filter(
						(c) => c.getAttribute('data-todo-id') !== draggedTodo!.id
					);
					index = filteredCards.findIndex((c) => c.getAttribute('data-todo-id') === todoId);
				} else {
					index = allCards.findIndex((c) => c.getAttribute('data-todo-id') === todoId);
				}

				if (index >= 0) {
					handleDragOver(listId, index, position);
					foundValidTarget = true;
				}
				break;
			}
		}

		// check for empty list area
		if (!foundValidTarget) {
			for (const el of elements) {
				const listEl = el.closest('[data-list-id]');
				if (listEl && !el.closest('[data-todo-id]')) {
					const listId = listEl.getAttribute('data-list-id')!;
					const sourceListId = draggedTodo!.list?.id || 'inbox';
					const allCards = Array.from(listEl.querySelectorAll('[data-todo-id]'));

					let finalIndex: number;
					if (listId === sourceListId) {
						const filteredCards = allCards.filter(
							(c) => c.getAttribute('data-todo-id') !== draggedTodo!.id
						);
						finalIndex = filteredCards.length;
					} else {
						finalIndex = allCards.length;
					}

					handleDragOver(listId, finalIndex, 'above');
					foundValidTarget = true;
					break;
				}
			}
		}

		if (!foundValidTarget && dropTarget) {
			dropTarget = null;
		}
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (draggedTodo) {
			handleAutoScroll(e.clientX);
		}
		updateDropTarget(e.clientX, e.clientY);
	}

	function handleGlobalTouchMove(e: TouchEvent) {
		if (!draggedTodo || e.touches.length === 0) return;
		const touch = e.touches[0];
		if (draggedTodo) {
			handleAutoScroll(touch.clientX);
		}
		updateDropTarget(touch.clientX, touch.clientY);
	}

	function handleGlobalTouchEnd(e: TouchEvent) {
		stopAutoScroll();
		// Safety net: if touch ends with active drag state but neodrag didn't fire dragEnd
		if (draggedTodo && dragStartTime > 0) {
			const dragDuration = Date.now() - dragStartTime;

			if (dragDuration > 100) {
				setTimeout(() => {
					if (draggedTodo) {
						draggedTodo = null;
						dropTarget = null;
						dragStartTime = 0;
					}
				}, 300);
			}
		}
	}

	async function handleDelete(todoId: string) {
		const result = await todosStore.deleteTodo(todoId);
		if (result.success) {
			displayMessage($t('todo.task_deleted'), 1500, true);
		} else {
			displayMessage(result.message || $t('todo.delete_failed'));
		}
	}

	function openListManagement() {
		actionState.edit = 'showListManagement';
	}

	function getFilterSummary(): string {
		const filters = todoFilteringStore.filters;
		const parts: string[] = [];

		if (filters.search) {
			parts.push($t('todo.search_filter'));
		}
		if (filters.listId) {
			if (filters.listId === 'inbox') {
				parts.push($t('todo.inbox_only'));
			} else if (filters.listId === 'completed') {
				parts.push($t('todo.completed_only'));
			} else {
				const list = listsStore.lists.find((l) => l.id === filters.listId);
				if (list) {
					parts.push($t('todo.list_filter') + list.name);
				}
			}
		}
		if (filters.dueToday) {
			parts.push($t('todo.due_today_filter'));
		}
		if (filters.overdue) {
			parts.push($t('todo.overdue_filter'));
		}

		return parts.join(', ');
	}
</script>

<svelte:window
	onmousemove={handleGlobalMouseMove}
	ontouchmove={handleGlobalTouchMove}
	ontouchend={handleGlobalTouchEnd}
/>

<div class="w-full" in:scale>
	<div class="px-6 pt-6 pb-2">
		{#if getFilterSummary()}
			<div class="mb-4 rounded-md bg-muted/50 p-3">
				<p class="text-sm text-muted-foreground">
					<span class="font-medium">{$t('todo.active_filters')}</span>
					{getFilterSummary()}
				</p>
			</div>
		{/if}
	</div>

	<div class="w-full overflow-x-auto" bind:this={scrollContainer}>
		<div class="flex min-w-max gap-6 p-6 pt-0">
			{#each kanbanLists() as { list, todos } (list.id)}
				{@const stats = todos.reduce(
					(acc, todo) => {
						const min = todo.min_hours || 0;
						const max = todo.max_hours || 0;
						if (min > 0 || max > 0) {
							const effectiveMin = min || max;
							const effectiveMax = max || min;
							acc.min += min;
							acc.max += max;
							acc.avg += (effectiveMin + effectiveMax) / 2;
							acc.count++;
						}
						return acc;
					},
					{ min: 0, max: 0, avg: 0, count: 0 }
				)}
				<div class="w-80 flex-shrink-0">
					<KanbanColumn
						list={{
							id: list.id,
							name: list.name,
							board:
								'board' in list && list.board && list.board.github
									? { github: list.board.github }
									: undefined
						}}
						{todos}
						{draggedTodo}
						{dropTarget}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
						onDelete={handleDelete}
					/>
					{#if stats.count > 0}
						<div class="-mt-2 text-center text-xs text-gray-400">
							<span title="Total Minimum Hours">Min: {stats.min.toFixed(1)}h</span> |
							<span title="Total Average Hours">Avg: {stats.avg.toFixed(1)}h</span> |
							<span title="Total Maximum Hours">Max: {stats.max.toFixed(1)}h</span>
						</div>
					{/if}
				</div>
			{/each}

			{#if filteredCompletedTodos().length > 0}
				<div class="w-80 flex-shrink-0">
					<Card class="opacity-75">
						<CardHeader>
							<CardTitle class="flex items-center justify-between text-sm text-green-600">
								<span>✓ {$t('todo.completed')}</span>
							</CardTitle>
							<CardDescription class="text-xs">
								{filteredCompletedTodos().length}
								{filteredCompletedTodos().length === 1 ? $t('todo.task') : $t('todo.tasks')}
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-2">
							{#each visibleCompletedTodos() as todo (todo.id)}
								<div
									class="group rounded border p-2 text-sm line-through opacity-60 transition-opacity hover:opacity-100"
								>
									<div class="flex items-center justify-between">
										<span>{todo.title}</span>
										<Button
											variant="ghost"
											size="sm"
											class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
											onclick={() => toggleTodoCompletion(todo.id)}
										>
											<RefreshCw class="h-3 w-3" />
										</Button>
									</div>
								</div>
							{/each}
							{#if hasMoreCompletedTodos()}
								<div class="pt-2">
									<Button
										variant="ghost"
										size="sm"
										class="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
										onclick={loadMoreCompletedTodos}
									>
										<ChevronDown class="mr-1 h-3 w-3" />
										{$t('todo.load_more')} ({Math.min(
											completedItemsInitially,
											filteredCompletedTodos().length - completedItemsToShow
										)})
									</Button>
								</div>
							{/if}
						</CardContent>
					</Card>
				</div>
			{/if}

			<div class="w-80 flex-shrink-0">
				<Card class="border-2 border-dashed border-muted-foreground/25 bg-muted/10">
					<CardHeader>
						<CardTitle class="text-sm text-muted-foreground">{$t('todo.add_new_list')}</CardTitle>
					</CardHeader>
					<CardContent class="flex flex-col gap-2">
						<Button
							variant="ghost"
							class="h-auto flex-col gap-1 p-4 text-muted-foreground hover:text-foreground"
							onclick={openListManagement}
						>
							<Plus class="h-8 w-8" />
							<span class="text-xs">{$t('todo.create_list')}</span>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
</div>
