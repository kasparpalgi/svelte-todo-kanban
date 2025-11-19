<!-- @file src/lib/components/todo/TodoFiltersSidebar.svelte -->
<script lang="ts">
	import {
		todoFilteringStore,
		type SortOrder,
		type SortDirection
	} from '$lib/stores/todoFiltering.svelte';
	import { t } from '$lib/i18n';
	import { actionState } from '$lib/stores/states.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { boardMembersStore } from '$lib/stores/boardMembers.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger,
		DropdownMenuCheckboxItem
	} from '$lib/components/ui/dropdown-menu';
	import {
		Search,
		ArrowUpNarrowWide,
		ArrowDownWideNarrow,
		Calendar,
		TriangleAlert,
		X,
		Funnel,
		User,
		Tag,
		AlertCircle
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	let searchTerm = $state('');
	let searchContentEnabled = $state(false);

	const user = $derived(userStore.user);
	const members = $derived(boardMembersStore.members);
	const currentBoard = $derived(listsStore.selectedBoard);
	const boardLabels = $derived(currentBoard?.labels || []);

	onMount(async () => {
		if (currentBoard?.id) {
			await boardMembersStore.loadMembers(currentBoard.id);
		}
		// Load initial search content state from filters
		searchContentEnabled = todoFilteringStore.filters.searchContent || false;
	});

	function handleSearchInput() {
		if (todoFilteringStore.setSearchFilter) {
			todoFilteringStore.setSearchFilter(searchTerm);
		} else {
			if (searchTerm.trim()) {
				todoFilteringStore.setFilter('search', searchTerm.trim());
			} else {
				todoFilteringStore.clearFilter('search');
			}
		}
	}

	function toggleFilter(key: string, value: any) {
		if (todoFilteringStore.filters[key as keyof typeof todoFilteringStore.filters] === value) {
			todoFilteringStore.clearFilter(key as any);
		} else {
			todoFilteringStore.setFilter(key as any, value);
		}
	}

	function setSorting(order: SortOrder) {
		const currentSorting = todoFilteringStore.sorting;
		const direction: SortDirection =
			currentSorting.order === order && currentSorting.direction === 'asc' ? 'desc' : 'asc';
		todoFilteringStore.setSorting(order, direction);
	}

	function clearAllFilters() {
		todoFilteringStore.clearAllFilters();
		searchTerm = '';
		searchContentEnabled = false;
	}

	function getActiveFilterCount() {
		const filters = todoFilteringStore.filters;
		return Object.keys(filters).filter(
			(key) =>
				key !== 'boardId' &&
				key !== 'searchContent' &&
				filters[key as keyof typeof filters] !== undefined
		).length;
	}

	function handleSearchContentToggle() {
		searchContentEnabled = !searchContentEnabled;
		if (searchContentEnabled) {
			todoFilteringStore.setFilter('searchContent', true);
		} else {
			todoFilteringStore.clearFilter('searchContent');
		}
	}

	function togglePriority(priority: string) {
		const currentPriorities = todoFilteringStore.filters.priority || [];
		if (currentPriorities.includes(priority)) {
			const newPriorities = currentPriorities.filter((p) => p !== priority);
			if (newPriorities.length === 0) {
				todoFilteringStore.clearFilter('priority');
			} else {
				todoFilteringStore.setFilter('priority', newPriorities);
			}
		} else {
			todoFilteringStore.setFilter('priority', [...currentPriorities, priority]);
		}
	}

	function toggleLabel(labelId: string) {
		const currentLabels = todoFilteringStore.filters.labelIds || [];
		if (currentLabels.includes(labelId)) {
			const newLabels = currentLabels.filter((id) => id !== labelId);
			if (newLabels.length === 0) {
				todoFilteringStore.clearFilter('labelIds');
			} else {
				todoFilteringStore.setFilter('labelIds', newLabels);
			}
		} else {
			todoFilteringStore.setFilter('labelIds', [...currentLabels, labelId]);
		}
	}

	function toggleAssignedToMe() {
		if (todoFilteringStore.filters.assignedToMe) {
			todoFilteringStore.clearFilter('assignedToMe');
		} else {
			todoFilteringStore.setFilter('assignedToMe', true);
			// Clear assignedTo filter if assignedToMe is enabled
			todoFilteringStore.clearFilter('assignedTo');
		}
	}

	function setAssignedTo(userId: string | null) {
		if (todoFilteringStore.filters.assignedTo === userId) {
			todoFilteringStore.clearFilter('assignedTo');
		} else {
			todoFilteringStore.setFilter('assignedTo', userId);
			// Clear assignedToMe filter if assignedTo is set
			todoFilteringStore.clearFilter('assignedToMe');
		}
	}

	let activeFilterCount = $derived(getActiveFilterCount());
	let currentFilters = $derived(todoFilteringStore.filters);
	let currentSorting = $derived(todoFilteringStore.sorting);
	let selectedPriorities = $derived(currentFilters.priority || []);
	let selectedLabels = $derived(currentFilters.labelIds || []);</script>

<div
	class="fixed top-0 right-0 z-50 h-screen w-80 overflow-y-auto border-l bg-background shadow-lg"
>
	<div class="space-y-4 p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h2 class="flex items-center gap-2 text-lg font-semibold">
					<Funnel class="h-5 w-5" />
					{$t('filters.title')}
				</h2>
				<kbd
					class="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground md:inline-flex md:items-center md:gap-1"
					title="{$t('filters.press')} F"
				>
					<span class="text-[10px] opacity-70">{$t('filters.press')}</span>
					<span class="text-sm font-semibold">F</span>
				</kbd>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => (actionState.showFilters = false)}
				class="h-8 w-8 p-0"
			>
				<X class="h-4 w-4" />
			</Button>
		</div>

		{#if activeFilterCount > 0}
			<div class="flex items-center justify-between">
				<Badge variant="secondary" class="text-xs">
					{activeFilterCount}
					{activeFilterCount === 1 ? $t('filters.active_filter') : $t('filters.active_filters')}
				</Badge>
				<Button variant="ghost" size="sm" onclick={clearAllFilters} class="h-6 text-xs">
					{$t('filters.clear_all')}
				</Button>
			</div>
		{/if}

		<Separator />

		<div class="space-y-2">
			<label for="search" class="text-sm font-medium">{$t('filters.search')}</label>
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder={$t('filters.search_placeholder')}
					bind:value={searchTerm}
					oninput={handleSearchInput}
					class="pl-9"
				/>
			</div>
			<div class="flex items-center gap-2 pl-1">
				<Checkbox
					id="search-content"
					checked={searchContentEnabled}
					onCheckedChange={handleSearchContentToggle}
				/>
				<label
					for="search-content"
					class="text-sm text-muted-foreground cursor-pointer select-none"
				>
					{$t('filters.search_content')}
				</label>
			</div>
		</div>

		<Separator />

		<!-- Quick Filters -->
		<div class="space-y-3">
			<label for="due" class="text-sm font-medium">{$t('filters.quick_filters')}</label>
			<div class="space-y-2">
				<Button
					variant={currentFilters.dueToday ? 'default' : 'outline'}
					size="sm"
					onclick={() => toggleFilter('dueToday', true)}
					class="w-full justify-start"
				>
					<Calendar class="mr-2 h-4 w-4" />
					{$t('filters.due_today')}
				</Button>

				<Button
					variant={currentFilters.overdue ? 'destructive' : 'outline'}
					size="sm"
					onclick={() => toggleFilter('overdue', true)}
					class="w-full justify-start"
				>
					<TriangleAlert class="mr-2 h-4 w-4" />
					{$t('filters.overdue')}
				</Button>
			</div>
		</div>

		<Separator />

		<!-- Assignment Filters -->
		<div class="space-y-3">
			<label class="text-sm font-medium">{$t('filters.assignment')}</label>
			<div class="space-y-2">
				<Button
					variant={currentFilters.assignedToMe ? 'default' : 'outline'}
					size="sm"
					onclick={toggleAssignedToMe}
					class="w-full justify-start"
				>
					<User class="mr-2 h-4 w-4" />
					{$t('filters.assigned_to_me')}
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild let:builder>
						<Button builders={[builder]} variant="outline" size="sm" class="w-full justify-start">
							<User class="mr-2 h-4 w-4" />
							{#if currentFilters.assignedTo === null}
								{$t('filters.unassigned')}
							{:else if currentFilters.assignedTo}
								{members.find((m) => m.user.id === currentFilters.assignedTo)?.user.name ||
									$t('filters.assigned_to_other')}
							{:else}
								{$t('filters.assigned_to_other')}
							{/if}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" class="w-48">
						<DropdownMenuCheckboxItem
							checked={currentFilters.assignedTo === null}
							onCheckedChange={() => setAssignedTo(null)}
						>
							{$t('filters.unassigned')}
						</DropdownMenuCheckboxItem>
						{#each members as member (member.id)}
							<DropdownMenuCheckboxItem
								checked={currentFilters.assignedTo === member.user.id}
								onCheckedChange={() => setAssignedTo(member.user.id)}
							>
								<div class="flex items-center gap-2">
									{#if member.user.image}
										<img
											src={member.user.image}
											alt={member.user.name || member.user.username}
											class="h-5 w-5 rounded-full"
										/>
									{:else}
										<div class="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
											<span class="text-xs text-muted-foreground">
												{(member.user.name || member.user.username)?.[0]?.toUpperCase()}
											</span>
										</div>
									{/if}
									<span class="text-sm">
										{member.user.name || member.user.username}
									</span>
								</div>
							</DropdownMenuCheckboxItem>
						{/each}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>

		<Separator />

		<!-- Priority Filters -->
		<div class="space-y-3">
			<label class="text-sm font-medium">{$t('filters.priority')}</label>
			<div class="space-y-1">
				<Button
					variant={selectedPriorities.includes('high') ? 'destructive' : 'outline'}
					size="sm"
					onclick={() => togglePriority('high')}
					class="w-full justify-start"
				>
					<AlertCircle class="mr-2 h-4 w-4" />
					{$t('todo.priority.high')}
				</Button>
				<Button
					variant={selectedPriorities.includes('medium') ? 'default' : 'outline'}
					size="sm"
					onclick={() => togglePriority('medium')}
					class="w-full justify-start"
				>
					<AlertCircle class="mr-2 h-4 w-4" />
					{$t('todo.priority.medium')}
				</Button>
				<Button
					variant={selectedPriorities.includes('low') ? 'secondary' : 'outline'}
					size="sm"
					onclick={() => togglePriority('low')}
					class="w-full justify-start"
				>
					<AlertCircle class="mr-2 h-4 w-4" />
					{$t('todo.priority.low')}
				</Button>
			</div>
		</div>

		<Separator />

		<!-- Label Filters -->
		{#if boardLabels.length > 0}
			<div class="space-y-3">
				<label class="text-sm font-medium">{$t('filters.labels')}</label>
				<div class="flex flex-wrap gap-2">
					{#each boardLabels as label (label.id)}
						<Button
							variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
							size="sm"
							onclick={() => toggleLabel(label.id)}
							class="gap-2"
							style={selectedLabels.includes(label.id)
								? `background-color: ${label.color}; border-color: ${label.color};`
								: `border-color: ${label.color}; color: ${label.color};`}
						>
							<Tag class="h-3 w-3" />
							{label.name}
						</Button>
					{/each}
				</div>
			</div>

			<Separator />
		{/if}

		<!-- Sorting -->
		<div class="space-y-3">
			<label for="sort" class="text-sm font-medium">{$t('filters.sort_by')}</label>
			<div class="space-y-1">
				<Button
					variant={currentSorting.order === 'sort_order' ? 'default' : 'ghost'}
					size="sm"
					onclick={() => setSorting('sort_order')}
					class="w-full justify-between"
				>
					<span>{$t('filters.manual_order')}</span>
					{#if currentSorting.order === 'sort_order'}
						{#if currentSorting.direction === 'asc'}
							<ArrowUpNarrowWide class="h-3 w-3" />
						{:else}
							<ArrowDownWideNarrow class="h-3 w-3" />
						{/if}
					{/if}
				</Button>

				<Button
					variant={currentSorting.order === 'due_date' ? 'default' : 'ghost'}
					size="sm"
					onclick={() => setSorting('due_date')}
					class="w-full justify-between"
				>
					<span>{$t('filters.due_date')}</span>
					{#if currentSorting.order === 'due_date'}
						{#if currentSorting.direction === 'asc'}
							<ArrowUpNarrowWide class="h-3 w-3" />
						{:else}
							<ArrowDownWideNarrow class="h-3 w-3" />
						{/if}
					{/if}
				</Button>

				<Button
					variant={currentSorting.order === 'created_date' ? 'default' : 'ghost'}
					size="sm"
					onclick={() => setSorting('created_date')}
					class="w-full justify-between"
				>
					<span>{$t('filters.created_date')}</span>
					{#if currentSorting.order === 'created_date'}
						{#if currentSorting.direction === 'asc'}
							<ArrowUpNarrowWide class="h-3 w-3" />
						{:else}
							<ArrowDownWideNarrow class="h-3 w-3" />
						{/if}
					{/if}
				</Button>

				<Button
					variant={currentSorting.order === 'updated_at' ? 'default' : 'ghost'}
					size="sm"
					onclick={() => setSorting('updated_at')}
					class="w-full justify-between"
				>
					<span>{$t('filters.recently_active')}</span>
					{#if currentSorting.order === 'updated_at'}
						{#if currentSorting.direction === 'asc'}
							<ArrowUpNarrowWide class="h-3 w-3" />
						{:else}
							<ArrowDownWideNarrow class="h-3 w-3" />
						{/if}
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>

<div
	tabindex="0"
	aria-label="Close sort/filter"
	role="button"
	onkeydown={(e) => {
		if (e.key === 'Esc') {
			actionState.showFilters = false;
		}
	}}
	class="fixed inset-0 z-40 bg-black/20"
	onclick={() => (actionState.showFilters = false)}
></div>
