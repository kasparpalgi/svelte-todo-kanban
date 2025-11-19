<!-- @file src/lib/components/invoice/InvoiceItemsEditor.svelte -->
<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Plus, Trash2, ListTodo } from 'lucide-svelte';

	interface Props {
		boardId: string;
		items: any[];
		onItemsChange?: (items: any[]) => void;
	}

	let { boardId, items = $bindable(), onItemsChange }: Props = $props();

	// Get todos for the board
	let todos = $derived.by(() => {
		const filteredTodos = todosStore.todos.filter(
			(todo) => todo.list?.board?.id === boardId && !todo.completed_at
		);
		console.log('[InvoiceItemsEditor] Filtered todos:', filteredTodos.length);
		console.log('[InvoiceItemsEditor] Board ID:', boardId);
		console.log('[InvoiceItemsEditor] All todos:', todosStore.todos.length);
		return filteredTodos;
	});

	let board = $derived(listsStore.boards.find((b) => b.id === boardId));
	let defaultHourlyRate = $derived(board?.customer_invoice_details?.hourly_rate || 0);

	let selectedTodoId = $state<string>('');

	function addTodoItem() {
		if (!selectedTodoId) return;

		const todo = todos.find((t) => t.id === selectedTodoId);
		if (!todo) return;

		// Calculate average hours if min/max are set
		let hours = 0;
		if (todo.actual_hours && todo.actual_hours > 0) {
			hours = todo.actual_hours - (todo.invoiced_hours || 0);
		} else if (todo.min_hours && todo.max_hours) {
			hours = (todo.min_hours + todo.max_hours) / 2;
		} else if (todo.min_hours) {
			hours = todo.min_hours;
		} else if (todo.max_hours) {
			hours = todo.max_hours;
		}

		// Don't add if already invoiced
		const alreadyAdded = items.some((item) => item.todo_id === todo.id);
		if (alreadyAdded) {
			return;
		}

		const amount = hours * defaultHourlyRate;

		const newItem = {
			todo_id: todo.id,
			description: todo.title,
			hours,
			rate: defaultHourlyRate,
			amount,
			sort_order: items.length
		};

		items = [...items, newItem];
		selectedTodoId = '';

		if (onItemsChange) {
			onItemsChange(items);
		}
	}

	function addCustomRow() {
		const newItem = {
			todo_id: null,
			description: '',
			hours: 0,
			rate: defaultHourlyRate,
			amount: 0,
			sort_order: items.length
		};

		items = [...items, newItem];

		if (onItemsChange) {
			onItemsChange(items);
		}
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);

		// Update sort orders
		items = items.map((item, i) => ({ ...item, sort_order: i }));

		if (onItemsChange) {
			onItemsChange(items);
		}
	}

	function updateItem(index: number, field: string, value: any) {
		items[index] = { ...items[index], [field]: value };

		// Recalculate amount if hours or rate changed
		if (field === 'hours' || field === 'rate') {
			items[index].amount = items[index].hours * items[index].rate;
		}

		if (onItemsChange) {
			onItemsChange(items);
		}
	}

	function getTodoDisplay(todoId: string): string {
		const todo = todos.find((t) => t.id === todoId);
		if (!todo) return 'Unknown todo';

		let info = todo.title;

		if (todo.actual_hours) {
			info += ` (${todo.actual_hours}h actual`;
			if (todo.invoiced_hours) {
				info += `, ${todo.invoiced_hours}h invoiced`;
			}
			info += ')';
		} else if (todo.min_hours || todo.max_hours) {
			info += ` (${todo.min_hours || 0}-${todo.max_hours || 0}h estimated)`;
		}

		return info;
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Invoice Items</CardTitle>
		<CardDescription>Add tasks or custom rows to this invoice</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<!-- Add Todo Item -->
		<div class="flex gap-2">
			<Select bind:value={selectedTodoId}>
				<SelectTrigger class="flex-1" placeholder="Select a task to add...">
					{selectedTodoId ? getTodoDisplay(selectedTodoId) : 'Select a task to add...'}
				</SelectTrigger>
				<SelectContent>
					{#each todos as todo (todo.id)}
						{#if !items.some((item) => item.todo_id === todo.id)}
							<SelectItem value={todo.id}>
								{getTodoDisplay(todo.id)}
							</SelectItem>
						{/if}
					{/each}
				</SelectContent>
			</Select>
			<Button
				onclick={addTodoItem}
				disabled={!selectedTodoId}
				variant="outline"
				class="gap-2"
			>
				<ListTodo class="h-4 w-4" />
				Add Task
			</Button>
			<Button
				onclick={addCustomRow}
				variant="outline"
				class="gap-2"
			>
				<Plus class="h-4 w-4" />
				Custom Row
			</Button>
		</div>

		<!-- Items List -->
		{#if items.length === 0}
			<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				<p>No items added yet. Add tasks or custom rows to get started.</p>
			</div>
		{:else}
			<div class="space-y-2">
				<div class="grid grid-cols-12 gap-2 text-sm font-semibold">
					<div class="col-span-5">Description</div>
					<div class="col-span-2">Hours</div>
					<div class="col-span-2">Rate</div>
					<div class="col-span-2">Amount</div>
					<div class="col-span-1"></div>
				</div>

				{#each items as item, index (index)}
					<div class="grid grid-cols-12 gap-2">
						<div class="col-span-5">
							<Input
								type="text"
								bind:value={item.description}
								placeholder="Description"
								disabled={!!item.todo_id}
								onblur={() => onItemsChange && onItemsChange(items)}
							/>
						</div>
						<div class="col-span-2">
							<Input
								type="number"
								step="0.25"
								min="0"
								bind:value={item.hours}
								oninput={() => updateItem(index, 'hours', item.hours)}
							/>
						</div>
						<div class="col-span-2">
							<Input
								type="number"
								step="0.01"
								min="0"
								bind:value={item.rate}
								oninput={() => updateItem(index, 'rate', item.rate)}
							/>
						</div>
						<div class="col-span-2">
							<Input
								type="number"
								step="0.01"
								min="0"
								bind:value={item.amount}
								oninput={() => updateItem(index, 'amount', item.amount)}
							/>
						</div>
						<div class="col-span-1">
							<Button
								onclick={() => removeItem(index)}
								variant="ghost"
								size="icon"
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
