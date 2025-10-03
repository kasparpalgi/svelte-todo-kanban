<!-- @file src/lib/components/todo/CardLabelManager.svelte -->
<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Plus, X, Tag } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';
    import { LABEL_COLORS } from '$lib/settings/labelColors.ts';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import type { LabelManagementProps } from '$lib/types/todo';

	let { todo }: LabelManagementProps = $props();

	let isCreatingLabel = $state(false);
	let newLabelName = $state('');
	let selectedColor = $state(LABEL_COLORS[0]);

	let availableLabels = $derived(() => {
		if (!todo.list?.board?.id) return [];
		const board = listsStore.boards.find((b) => b.id === todo.list?.board?.id);
		return board?.labels || [];
	});

	let assignedLabelIds = $derived(() => {
		return new Set((todo.labels || []).map((tl) => tl.label.id));
	});

	async function addLabel(labelId: string) {
		const result = await labelsStore.addTodoLabel(todo.id, labelId);
		if (result.success) {
			displayMessage('Label added', 1500, true);
		} else {
			displayMessage(result.message || 'Failed to add label');
		}
	}

	async function removeLabel(labelId: string) {
		const result = await labelsStore.removeTodoLabel(todo.id, labelId);
		if (result.success) {
			displayMessage('Label removed', 1500, true);
		} else {
			displayMessage(result.message || 'Failed to remove label');
		}
	}

	async function createLabel() {
		if (!newLabelName.trim() || !todo.list?.board?.id) return;

		const result = await labelsStore.createLabel(
			todo.list.board.id,
			newLabelName.trim(),
			selectedColor
		);

		if (result.success) {
			displayMessage('Label created', 1500, true);
			newLabelName = '';
			selectedColor = LABEL_COLORS[0];
			isCreatingLabel = false;
			await listsStore.loadBoards();
		} else {
			displayMessage(result.message || 'Failed to create label');
		}
	}
</script>

<div>
	<Label class="mb-2 flex items-center gap-2">
		<Tag class="h-4 w-4" />
		Labels
	</Label>

	<div class="flex flex-wrap items-center gap-2">
		{#each todo.labels || [] as { label }}
			<Badge
				style="background-color: {label.color}"
				class="group relative cursor-pointer text-xs text-white"
			>
				{label.name}
				<button
					onclick={() => removeLabel(label.id)}
					class="ml-1 opacity-0 transition-opacity group-hover:opacity-100"
					aria-label="Remove label"
				>
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/each}

		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="outline" size="sm" class="h-6">
					<Plus class="h-3 w-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" class="w-64">
				{#if !isCreatingLabel}
					{#each availableLabels() as label}
						{#if !assignedLabelIds().has(label.id)}
							<DropdownMenuItem onclick={() => addLabel(label.id)}>
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded" style="background-color: {label.color}"></div>
									<span>{label.name}</span>
								</div>
							</DropdownMenuItem>
						{/if}
					{/each}

					{#if availableLabels().length > 0 && availableLabels().some((l) => !assignedLabelIds().has(l.id))}
						<DropdownMenuSeparator />
					{/if}

					<DropdownMenuItem onclick={() => (isCreatingLabel = true)}>
						<Plus class="mr-2 h-3 w-3" />
						Create new label
					</DropdownMenuItem>
				{:else}
					<div class="p-2 space-y-2" onclick={(e) => e.stopPropagation()}>
						<Input
							bind:value={newLabelName}
							placeholder="Label name"
							class="h-8"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									createLabel();
								} else if (e.key === 'Escape') {
									isCreatingLabel = false;
									newLabelName = '';
								}
							}}
						/>

						<div class="grid grid-cols-6 gap-1">
							{#each LABEL_COLORS as color}
								<button
									onclick={() => (selectedColor = color)}
									class="h-6 w-6 rounded border-2 transition-transform hover:scale-110 {selectedColor ===
									color
										? 'border-foreground'
										: 'border-transparent'}"
									style="background-color: {color}"
									aria-label="Select color"
								></button>
							{/each}
						</div>

						<div class="flex gap-2">
							<Button
								size="sm"
								onclick={createLabel}
								disabled={!newLabelName.trim()}
								class="h-7 flex-1"
							>
								Create
							</Button>
							<Button
								size="sm"
								variant="outline"
								onclick={() => {
									isCreatingLabel = false;
									newLabelName = '';
								}}
								class="h-7"
							>
								Cancel
							</Button>
						</div>
					</div>
				{/if}
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
</div>