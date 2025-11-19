/** @file src/lib/stores/todoFiltering.svelte.ts */
import { browser } from '$app/environment';
import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

export type SortOrder = 'sort_order' | 'due_date' | 'created_date' | 'updated_at' | 'priority';
export type SortDirection = 'asc' | 'desc';

export interface TodoFilters {
	boardId?: string | null;
	listId?: string | null;
	completed?: boolean;
	search?: string;
	searchContent?: boolean;
	dueToday?: boolean;
	overdue?: boolean;
	priority?: string[];
	assignedToMe?: boolean;
	assignedTo?: string | null;
	labelIds?: string[];
}

export interface TodoSorting {
	order: SortOrder;
	direction: SortDirection;
}

interface FilteringState {
	filters: TodoFilters;
	sorting: TodoSorting;
	pagination: {
		limit: number;
		offset: number;
		hasMore: boolean;
	};
}

function createTodoFilteringStore() {
	const state = $state<FilteringState>({
		filters: {},
		sorting: {
			order: 'sort_order',
			direction: 'asc'
		},
		pagination: {
			limit: 50,
			offset: 0,
			hasMore: true
		}
	});

	// Load saved preferences from localStorage
	function loadPreferences() {
		if (!browser) return;

		try {
			const saved = localStorage.getItem('todo-filtering-preferences');
			if (saved) {
				const prefs = JSON.parse(saved);
				if (prefs.sorting) {
					state.sorting = { ...state.sorting, ...prefs.sorting };
				}
				if (prefs.filters) {
					state.filters = { ...state.filters, ...prefs.filters };
				}
			}
		} catch (error) {
			console.warn('Failed to load filtering preferences:', error);
		}
	}

	// Save preferences to localStorage
	function savePreferences() {
		if (!browser) return;

		try {
			localStorage.setItem(
				'todo-filtering-preferences',
				JSON.stringify({
					sorting: state.sorting,
					filters: state.filters
				})
			);
		} catch (error) {
			console.warn('Failed to save filtering preferences:', error);
		}
	}

	// Filter based on current filters
	function filterTodos(todos: TodoFieldsFragment[], currentUserId?: string): TodoFieldsFragment[] {
		return todos.filter((todo) => {
			if (todo.list?.board?.id !== state.filters.boardId) return false;

			if (state.filters.listId !== undefined) {
				if (state.filters.listId === 'inbox') {
					if (todo.list?.id) return false;
				} else if (state.filters.listId === 'completed') {
					if (!todo.completed_at) return false;
				} else {
					if (todo.list?.id !== state.filters.listId) return false;
				}
			}

			if (state.filters.completed !== undefined) {
				const isCompleted = !!todo.completed_at;
				if (isCompleted !== state.filters.completed) return false;
			}

			if (state.filters.search) {
				const searchTerm = state.filters.search.toLowerCase();
				const titleMatch = todo.title.toLowerCase().includes(searchTerm);

				// Only search content if searchContent flag is true
				if (state.filters.searchContent) {
					const contentMatch = todo.content?.toLowerCase().includes(searchTerm) || false;
					if (!titleMatch && !contentMatch) return false;
				} else {
					if (!titleMatch) return false;
				}
			}

			if (state.filters.dueToday) {
				if (!todo.due_on) return false;
				const today = new Date().toDateString();
				const dueDate = new Date(todo.due_on).toDateString();
				if (today !== dueDate) return false;
			}

			if (state.filters.overdue) {
				if (!todo.due_on || todo.completed_at) return false;
				const now = new Date();
				const dueDate = new Date(todo.due_on);
				if (dueDate >= now) return false;
			}

			if (state.filters.priority && state.filters.priority.length > 0) {
				if (!todo.priority || !state.filters.priority.includes(todo.priority)) return false;
			}

			// Filter by assignment
			if (state.filters.assignedToMe && currentUserId) {
				if (todo.assigned_to !== currentUserId) return false;
			}

			if (state.filters.assignedTo !== undefined) {
				if (state.filters.assignedTo === null) {
					// Filter for unassigned tasks
					if (todo.assigned_to !== null) return false;
				} else {
					// Filter for specific assignee
					if (todo.assigned_to !== state.filters.assignedTo) return false;
				}
			}

			// Filter by labels
			if (state.filters.labelIds && state.filters.labelIds.length > 0) {
				const todoLabelIds = todo.labels?.map(l => l.label?.id).filter(Boolean) || [];
				const hasMatchingLabel = state.filters.labelIds.some(labelId =>
					todoLabelIds.includes(labelId)
				);
				if (!hasMatchingLabel) return false;
			}

			return true;
		});
	}

	// Sort based on current sorting
	function sortTodos(todos: TodoFieldsFragment[]): TodoFieldsFragment[] {
		const sorted = [...todos].sort((a, b) => {
			let aValue: any;
			let bValue: any;

			switch (state.sorting.order) {
				case 'sort_order':
					aValue = a.sort_order || 999999;
					bValue = b.sort_order || 999999;
					break;
				case 'due_date':
					aValue = a.due_on ? new Date(a.due_on).getTime() : 999999999999;
					bValue = b.due_on ? new Date(b.due_on).getTime() : 999999999999;
					break;
				case 'created_date':
					aValue = new Date(a.created_at).getTime();
					bValue = new Date(b.created_at).getTime();
					break;
				case 'updated_at':
					aValue = new Date(a.updated_at).getTime();
					bValue = new Date(b.updated_at).getTime();
					break;
				case 'priority':
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
					bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return state.sorting.direction === 'asc' ? -1 : 1;
			if (aValue > bValue) return state.sorting.direction === 'asc' ? 1 : -1;
			return 0;
		});

		return sorted;
	}

	function paginateTodos(todos: TodoFieldsFragment[]): TodoFieldsFragment[] {
		const start = state.pagination.offset;
		const end = start + state.pagination.limit;
		const paginatedTodos = todos.slice(start, end);

		// Update hasMore flag
		state.pagination.hasMore = end < todos.length;

		return paginatedTodos;
	}

	// Get filtered, sorted & paginated
	function getProcessedTodos(
		todos: TodoFieldsFragment[],
		includePagination = true,
		currentUserId?: string
	): TodoFieldsFragment[] {
		let result = filterTodos(todos, currentUserId);
		result = sortTodos(result);

		if (includePagination) {
			result = paginateTodos(result);
		}

		return result;
	}

	// Group by list (for kanban only?)
	function getTodosByList(todos: TodoFieldsFragment[], currentUserId?: string): Map<string, TodoFieldsFragment[]> {
		const filtered = filterTodos(todos.filter((t) => !t.completed_at), currentUserId);
		const sorted = sortTodos(filtered);

		const groups = new Map<string, TodoFieldsFragment[]>();

		for (const todo of sorted) {
			const listId = todo.list?.id || 'inbox';
			if (!groups.has(listId)) {
				groups.set(listId, []);
			}
			groups.get(listId)!.push(todo);
		}

		return groups;
	}

	let searchTimeout: number | undefined;

	function setSearchFilter(searchTerm: string) {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(() => {
			if (searchTerm.trim()) {
				setFilter('search', searchTerm.trim());
			} else {
				clearFilter('search');
			}
		}, 300) as unknown as number;
	}

	loadPreferences();

	function setFilter(key: keyof TodoFilters, value: any) {
		state.filters[key] = value;
		resetPagination();
		savePreferences();
	}

	function clearFilter(key: keyof TodoFilters) {
		delete state.filters[key];
		resetPagination();
		savePreferences();
	}

	function clearAllFilters() {
		state.filters = {};
		resetPagination();
		savePreferences();
	}

	function setSorting(order: SortOrder, direction: SortDirection) {
		state.sorting = { order, direction };
		resetPagination();
		savePreferences();
	}

	function resetPagination() {
		state.pagination.offset = 0;
		state.pagination.hasMore = true;
	}

	function loadMore() {
		if (state.pagination.hasMore) {
			state.pagination.offset += state.pagination.limit;
		}
	}

	function setPaginationLimit(limit: number) {
		state.pagination.limit = limit;
		resetPagination();
	}

	function getActiveTodos(todos: TodoFieldsFragment[], currentUserId?: string): TodoFieldsFragment[] {
		const activeOnly = todos.filter((t) => !t.completed_at);
		return getProcessedTodos(activeOnly, false, currentUserId); // Don't include pagination
	}

	function getCompletedTodos(todos: TodoFieldsFragment[], currentUserId?: string): TodoFieldsFragment[] {
		const completedOnly = todos.filter((t) => !!t.completed_at);
		return sortTodos(completedOnly); // Sort only completed todos
	}

	return {
		get filters() {
			return state.filters;
		},
		get sorting() {
			return state.sorting;
		},
		get pagination() {
			return state.pagination;
		},

		getProcessedTodos,
		getActiveTodos,
		getCompletedTodos,
		getTodosByList,
		filterTodos,
		sortTodos,

		setSearchFilter,
		setFilter,
		clearFilter,
		clearAllFilters,
		setSorting,
		resetPagination,
		loadMore,
		setPaginationLimit,

		savePreferences,
		loadPreferences
	};
}

export const todoFilteringStore = createTodoFilteringStore();
