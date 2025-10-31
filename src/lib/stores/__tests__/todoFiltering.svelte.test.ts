/** @file src/lib/stores/__tests__/todoFiltering.svelte.test.ts */
import { todoFilteringStore } from '../todoFiltering.svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true
});

vi.mock('$app/environment', () => ({
	browser: true
}));

const createMockTodo = (overrides: Partial<TodoFieldsFragment> = {}): TodoFieldsFragment => ({
	id: 'test-id',
	title: 'Test Todo',
	content: 'Test content',
	completed_at: null,
	due_on: null,
	has_time: false,
	priority: 'medium',
	sort_order: 1,
	created_at: '2025-01-01T00:00:00Z',
	updated_at: '2025-01-01T00:00:00Z',
	list: null,
	uploads: [],
	labels: [],
	comments: [],
	__typename: 'todos',
	...overrides
});

describe('TodoFilteringStore', () => {
	beforeEach(() => {
		localStorage.clear();
		todoFilteringStore.clearAllFilters();
		todoFilteringStore.resetPagination();
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe('Initial State', () => {
		it('should initialize with default values', () => {
			expect(todoFilteringStore.filters).toEqual({});
			expect(todoFilteringStore.sorting).toEqual({ order: 'sort_order', direction: 'asc' });
			expect(todoFilteringStore.pagination).toEqual({ limit: 50, offset: 0, hasMore: true });
		});
	});

	describe('Filter Management', () => {
		it('should set and clear filters correctly', () => {
			todoFilteringStore.setFilter('completed', true);
			expect(todoFilteringStore.filters.completed).toBe(true);

			todoFilteringStore.clearFilter('completed');
			expect(todoFilteringStore.filters.completed).toBeUndefined();
		});

		it('should reset pagination when setting filters', () => {
			todoFilteringStore.loadMore(); // Increase offset
			expect(todoFilteringStore.pagination.offset).toBeGreaterThan(0);

			todoFilteringStore.setFilter('search', 'test');
			expect(todoFilteringStore.pagination.offset).toBe(0);
			expect(todoFilteringStore.pagination.hasMore).toBe(true);
		});

		it('should clear all filters', () => {
			todoFilteringStore.setFilter('completed', true);
			todoFilteringStore.setFilter('search', 'test');

			todoFilteringStore.clearAllFilters();
			expect(todoFilteringStore.filters).toEqual({});
		});
	});

	describe('Search Filter with Debouncing', () => {
		it('should debounce search filter updates', async () => {
			vi.useFakeTimers();

			todoFilteringStore.setSearchFilter('te');
			expect(todoFilteringStore.filters.search).toBeUndefined();

			vi.advanceTimersByTime(150);
			expect(todoFilteringStore.filters.search).toBeUndefined(); // Still debouncing

			vi.advanceTimersByTime(200);
			expect(todoFilteringStore.filters.search).toBe('te');

			vi.useRealTimers();
		});

		it('should clear search filter for empty strings', async () => {
			vi.useFakeTimers();

			todoFilteringStore.setFilter('search', 'existing');
			todoFilteringStore.setSearchFilter('  '); // Whitespace only

			vi.advanceTimersByTime(300);
			expect(todoFilteringStore.filters.search).toBeUndefined();

			vi.useRealTimers();
		});

		it('should cancel previous debounced search', async () => {
			vi.useFakeTimers();

			todoFilteringStore.setSearchFilter('first');
			vi.advanceTimersByTime(100);

			todoFilteringStore.setSearchFilter('second'); // Should cancel first
			vi.advanceTimersByTime(300);

			expect(todoFilteringStore.filters.search).toBe('second');

			vi.useRealTimers();
		});
	});

	describe('Todo Filtering Logic', () => {
		const mockTodos: TodoFieldsFragment[] = [
			createMockTodo({
				id: '1',
				                title: 'Active Todo',
				                completed_at: null,
				                list: {
				                    id: 'list1',
				                    name: 'Work',
				                    sort_order: 1,
				                    board: {
				                        id: 'board1',
				                        name: 'Main Board',
				                        alias: 'main-board',
				                        sort_order: 1,
				                        settings: {},
				                        __typename: 'boards'
				                    },
				                    __typename: 'lists'
				                }			}),
			createMockTodo({
				id: '2',
				title: 'Completed Todo',
				completed_at: '2025-01-01T12:00:00Z',
				list: {
					id: 'list1',
					name: 'Work',
					sort_order: 1,
					board: {
						id: 'board1',
						name: 'Main Board',
						alias: 'main-board',
						sort_order: 1,
						settings: {},
						__typename: 'boards'
					},
					__typename: 'lists'
				}
			}),
			createMockTodo({
				id: '3',
				title: 'Overdue Todo',
				                due_on: '2024-12-01T00:00:00Z',
				                completed_at: null,
				                list: {
				                    id: 'list1',
				                    name: 'Work',
				                    sort_order: 1,
				                    board: {
				                        id: 'board1',
				                        name: 'Main Board',
				                        alias: 'main-board',
				                        sort_order: 1,
				                        settings: {},
				                        __typename: 'boards'
				                    },
				                    __typename: 'lists'
				                }			}),
			createMockTodo({
				id: '4',
				title: 'High Priority Task',
				priority: 'high',
				completed_at: null,
				list: {
					id: 'list1',
					name: 'Work',
					sort_order: 1,
					board: {
						id: 'board1',
						name: 'Main Board',
						alias: 'main-board',
						sort_order: 1,
						settings: null,
						__typename: 'boards'
					},
					__typename: 'lists'
				}
			})
		];

		it('should filter by completion status', () => {
			todoFilteringStore.setFilter('boardId', 'board1');
			todoFilteringStore.setFilter('completed', true);
			const filtered = todoFilteringStore.filterTodos(mockTodos);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe('2');
		});

		it('should filter by board correctly', () => {
			todoFilteringStore.setFilter('boardId', 'board1');
			const filtered = todoFilteringStore.filterTodos(mockTodos);

			expect(filtered).toHaveLength(4);
			expect(filtered.every((todo: TodoFieldsFragment) => todo.list?.board?.id === 'board1')).toBe(
				true
			);
		});

		it('should filter by search term in title and content', () => {
			const todosWithContent = [
				createMockTodo({
					id: '1',
					title: 'Task',
					content: 'Important work',
					list: {
						id: 'list1',
						name: 'Work',
						sort_order: 1,
						board: {
							id: 'board1',
							name: 'Main Board',
							alias: 'main-board',
							sort_order: 1,
							settings: null,
							__typename: 'boards'
						},
						__typename: 'lists'
					}
				}),
				createMockTodo({
					id: '2',
					title: 'Important Task',
					content: 'Regular work',
					list: {
						id: 'list1',
						name: 'Work',
						sort_order: 1,
						board: {
							id: 'board1',
							name: 'Main Board',
							alias: 'main-board',
							sort_order: 1,
							settings: null,
							__typename: 'boards'
						},
						__typename: 'lists'
					}
				}),
				createMockTodo({
					id: '3',
					title: 'Other',
					content: 'Different stuff',
					list: {
						id: 'list1',
						name: 'Work',
						sort_order: 1,
						board: {
							id: 'board1',
							name: 'Main Board',
							alias: 'main-board',
							sort_order: 1,
							settings: null,
							__typename: 'boards'
						},
						__typename: 'lists'
					}
				})
			];

			todoFilteringStore.setFilter('boardId', 'board1');
			todoFilteringStore.setFilter('search', 'important');
			const filtered = todoFilteringStore.filterTodos(todosWithContent);

			expect(filtered).toHaveLength(2);
			expect(filtered.map((t: TodoFieldsFragment) => t.id)).toEqual(['1', '2']);
		});

		it('should filter overdue todos correctly', () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-01-15'));

			todoFilteringStore.setFilter('boardId', 'board1');
			todoFilteringStore.setFilter('overdue', true);
			const filtered = todoFilteringStore.filterTodos(mockTodos);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe('3');

			vi.useRealTimers();
		});

		it('should filter by priority', () => {
			todoFilteringStore.setFilter('boardId', 'board1');
			todoFilteringStore.setFilter('priority', ['high', 'medium']);
			const filtered = todoFilteringStore.filterTodos(mockTodos);

			expect(filtered).toHaveLength(4);
		});
	});

	describe('Todo Sorting Logic', () => {
		const unsortedTodos = [
			createMockTodo({
				id: '1',
				sort_order: 3,
				created_at: '2025-01-03T00:00:00Z',
				due_on: '2025-01-05T00:00:00Z',
				priority: 'low'
			}),
			createMockTodo({
				id: '2',
				sort_order: 1,
				created_at: '2025-01-01T00:00:00Z',
				due_on: null,
				priority: 'high'
			}),
			createMockTodo({
				id: '3',
				sort_order: 2,
				created_at: '2025-01-02T00:00:00Z',
				due_on: '2025-01-03T00:00:00Z',
				priority: 'medium'
			})
		];

		it('should sort by sort_order', () => {
			todoFilteringStore.setSorting('sort_order', 'asc');
			const sorted = todoFilteringStore.sortTodos(unsortedTodos);

			expect(sorted.map((t: TodoFieldsFragment) => t.id)).toEqual(['2', '3', '1']);
		});

		it('should sort by due date with nulls last', () => {
			todoFilteringStore.setSorting('due_date', 'asc');
			const sorted = todoFilteringStore.sortTodos(unsortedTodos);

			expect(sorted.map((t: TodoFieldsFragment) => t.id)).toEqual(['2', '3', '1']);
		});

		it('should sort by priority correctly', () => {
			todoFilteringStore.setSorting('priority', 'desc');
			const sorted = todoFilteringStore.sortTodos(unsortedTodos);

			expect(sorted.map((t: TodoFieldsFragment) => t.id)).toEqual(['2', '3', '1']); // high, medium, low
		});

		it('should respect sort direction', () => {
			todoFilteringStore.setSorting('sort_order', 'desc');
			const sorted = todoFilteringStore.sortTodos(unsortedTodos);

			expect(sorted.map((t: TodoFieldsFragment) => t.id)).toEqual(['1', '3', '2']);
		});
	});

	describe('LocalStorage Persistence', () => {
		it('should save preferences to localStorage', () => {
			todoFilteringStore.setFilter('completed', true);
			todoFilteringStore.setSorting('due_date', 'desc');

			const saved = JSON.parse(localStorage.getItem('todo-filtering-preferences') || '{}');
			expect(saved.filters.completed).toBe(true);
			expect(saved.sorting).toEqual({ order: 'due_date', direction: 'desc' });
		});

		it('should handle corrupted localStorage gracefully', () => {
			localStorage.setItem('todo-filtering-preferences', 'invalid-json');

			expect(() => todoFilteringStore.loadPreferences()).not.toThrow();
		});
	});
});
