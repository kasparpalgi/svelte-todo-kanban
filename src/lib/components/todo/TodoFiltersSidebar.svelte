<!-- @file src/lib/components/todo/TodoFiltersSidebar.svelte -->
<script lang="ts">
	import {
		todoFilteringStore,
		type SortOrder,
		type SortDirection
	} from '$lib/stores/todoFiltering.svelte';
	import { t } from '$lib/i18n';
	import { actionState } from '$lib/stores/states.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Search,
		ArrowUpNarrowWide,
		ArrowDownWideNarrow,
		Calendar,
		TriangleAlert,
		X,
		Funnel
	} from 'lucide-svelte';
	let searchTerm = $state('');

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
	}

	function getActiveFilterCount() {
		const filters = todoFilteringStore.filters;
		return Object.keys(filters).filter(
			(key) => key !== 'boardId' && filters[key as keyof typeof filters] !== undefined
		).length;
	}

	let activeFilterCount = $derived(getActiveFilterCount());
	let currentFilters = $derived(todoFilteringStore.filters);
	let currentSorting = $derived(todoFilteringStore.sorting);
</script>

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
					title="Press F to toggle filters"
				>
					<span class="text-[10px] opacity-70">Press</span>
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
