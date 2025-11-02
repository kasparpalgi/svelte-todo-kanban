import { describe, it, expect, beforeEach } from 'vitest';
import { trackerStatsStore } from '$lib/stores/trackerStats.svelte';
import type { SessionBreakdown } from '$lib/stores/trackerStats.svelte';

describe('TrackerStats Store', () => {
	beforeEach(() => {
		// Reset store state before each test
		trackerStatsStore.setUnmatchedThreshold(3600); // 60 minutes
	});

	describe('matchWindowTitle', () => {
		it('should match project keywords', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'svelte-todo-kanban',
					case_sensitive: false,
					board_id: 'board-1',
					board: { id: 'board-1', name: 'Project 1', alias: 'p1' },
					tracker_category: null
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'TodoItem.svelte - svelte-todo-kanban - Visual Studio Code',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:05:00Z',
						duration_seconds: 300,
						tracker_app: { id: 1, name: 'vscode' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			expect(stats.byProject.size).toBe(1);
			expect(stats.byProject.get('board-1')?.totalSeconds).toBe(300);
			expect(stats.matchedPercentage).toBe(100);
		});

		it('should match category keywords', () => {
			const keywords = [
				{
					id: '2',
					keyword: 'Work',
					case_sensitive: false,
					board_id: null,
					board: null,
					tracker_category: {
						id: 'cat-1',
						name: 'Work',
						parent_category: null,
						sub_categories: []
					}
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'Work Document - Google Docs',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:10:00Z',
						duration_seconds: 600,
						tracker_app: { id: 1, name: 'chrome' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			expect(stats.byCategory.size).toBe(1);
			expect(stats.byCategory.get('cat-1')?.totalSeconds).toBe(600);
		});

		it('should prefer longest keyword match', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'kanban',
					case_sensitive: false,
					board_id: 'board-1',
					board: { id: 'board-1', name: 'Project A', alias: 'pa' },
					tracker_category: null
				},
				{
					id: '2',
					keyword: 'svelte-todo-kanban',
					case_sensitive: false,
					board_id: 'board-2',
					board: { id: 'board-2', name: 'Project B', alias: 'pb' },
					tracker_category: null
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'App.svelte - svelte-todo-kanban - VSCode',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:05:00Z',
						duration_seconds: 300,
						tracker_app: { id: 1, name: 'vscode' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			// Should match "svelte-todo-kanban" (longer) not just "kanban"
			expect(stats.byProject.get('board-2')?.totalSeconds).toBe(300);
			expect(stats.byProject.get('board-1')).toBeUndefined();
		});

		it('should be case-insensitive by default', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'Project',
					case_sensitive: false,
					board_id: 'board-1',
					board: { id: 'board-1', name: 'Project', alias: 'p1' },
					tracker_category: null
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'Working on PROJECT today',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:05:00Z',
						duration_seconds: 300,
						tracker_app: { id: 1, name: 'vscode' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			expect(stats.byProject.get('board-1')?.totalSeconds).toBe(300);
		});

		it('should respect case-sensitive flag', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'WORK',
					case_sensitive: true,
					board_id: 'board-1',
					board: { id: 'board-1', name: 'Project', alias: 'p1' },
					tracker_category: null
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'work on this',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:05:00Z',
						duration_seconds: 300,
						tracker_app: { id: 1, name: 'vscode' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			// Should NOT match because case is different and case_sensitive=true
			expect(stats.byProject.get('board-1')).toBeUndefined();
			expect(stats.unmatchedSessionCount).toBe(1);
		});
	});

	describe('Threshold Logic', () => {
		it('should exclude unmatched sessions exceeding threshold', () => {
			const keywords: any[] = [];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'Unknown app',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:00:00Z',
						duration_seconds: 120 * 60, // 120 minutes
						tracker_app: { id: 1, name: 'unknown' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z'),
				60 * 60 // 60 minute threshold
			);

			// Session > threshold should be excluded
			expect(stats.unmatchedSeconds).toBe(0);
			expect(stats.unmatchedSessionCount).toBe(0);
		});

		it('should include unmatched sessions below threshold', () => {
			const keywords: any[] = [];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'Unknown app',
						start_time: '2025-01-01T10:00:00Z',
						end_time: '2025-01-01T10:00:00Z',
						duration_seconds: 30 * 60, // 30 minutes
						tracker_app: { id: 1, name: 'unknown' }
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z'),
				60 * 60 // 60 minute threshold
			);

			// Session < threshold should be included
			expect(stats.unmatchedSeconds).toBe(30 * 60);
			expect(stats.unmatchedSessionCount).toBe(1);
		});
	});

	describe('Example from specification', () => {
		it('should correctly calculate Example 1', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'project 1',
					case_sensitive: false,
					board_id: 'p1',
					board: { id: 'p1', name: 'Project 1', alias: 'p1' },
					tracker_category: null
				},
				{
					id: '2',
					keyword: 'entertainment',
					case_sensitive: false,
					board_id: null,
					board: null,
					tracker_category: {
						id: 'cat-ent',
						name: 'Entertainment',
						parent_category: null,
						sub_categories: []
					}
				}
			];

			// 10min project 1 + 10min work + 10min work + 10min project 1 + 10min entertainment
			// + 10min entertainment + 10min project 1 + 60min unknown (exceeds 60min threshold)
			// + 10min project 1
			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'window - project 1',
						start_time: '2025-01-01T10:00:00Z',
						duration_seconds: 600
					},
					{
						id: 2,
						window_title: 'category work',
						start_time: '2025-01-01T10:10:00Z',
						duration_seconds: 600
					},
					{
						id: 3,
						window_title: 'another work',
						start_time: '2025-01-01T10:20:00Z',
						duration_seconds: 600
					},
					{
						id: 4,
						window_title: 'work on project 1',
						start_time: '2025-01-01T10:30:00Z',
						duration_seconds: 600
					},
					{
						id: 5,
						window_title: 'entertainment',
						start_time: '2025-01-01T10:40:00Z',
						duration_seconds: 600
					},
					{
						id: 6,
						window_title: 'more entertainment',
						start_time: '2025-01-01T10:50:00Z',
						duration_seconds: 600
					},
					{
						id: 7,
						window_title: 'project 1 task',
						start_time: '2025-01-01T11:00:00Z',
						duration_seconds: 600
					},
					{
						id: 8,
						window_title: 'unknown session',
						start_time: '2025-01-01T11:10:00Z',
						duration_seconds: 3600 // 60 minutes - exceeds threshold
					},
					{
						id: 9,
						window_title: 'final project 1',
						start_time: '2025-01-01T12:10:00Z',
						duration_seconds: 600
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z'),
				3600 // 60 minute threshold
			);

			// Project 1: sessions 1, 4, 7, 9 = 4 * 600 = 2400 seconds (40 minutes)
			expect(stats.byProject.get('p1')?.totalSeconds).toBe(2400);
			expect(stats.byProject.get('p1')?.sessionCount).toBe(4);

			// Entertainment: sessions 5, 6 = 2 * 600 = 1200 seconds (20 minutes)
			expect(stats.byCategory.get('cat-ent')?.totalSeconds).toBe(1200);

			// Unmatched/Work: sessions 2, 3 (work is unknown as category) = 2 * 600 = 1200 seconds
			expect(stats.unmatchedSeconds).toBe(1200);

			// Session 8 (60 min) exceeds threshold so it's excluded entirely
			// Total = 2400 + 1200 + 1200 + 3600 = 8400 seconds
			expect(stats.totalSeconds).toBe(8400);

			// Matched % = (2400 + 1200) / 8400 = 42.86%
			expect(Math.round(stats.matchedPercentage)).toBe(43);
		});
	});

	describe('Session breakdown tracking', () => {
		it('should track all sessions with reasons', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'project',
					case_sensitive: false,
					board_id: 'p1',
					board: { id: 'p1', name: 'Project', alias: 'p1' },
					tracker_category: null
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'work on project',
						start_time: '2025-01-01T10:00:00Z',
						duration_seconds: 300
					},
					{
						id: 2,
						window_title: 'unknown',
						start_time: '2025-01-01T10:05:00Z',
						duration_seconds: 120
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			expect(stats.sessions.length).toBe(2);
			expect(stats.sessions[0].reason).toContain('Matched to project');
			expect(stats.sessions[1].reason).toContain('Unmatched session');
		});
	});

	describe('Percentage calculations', () => {
		it('should calculate percentages based on total time', () => {
			const keywords = [
				{
					id: '1',
					keyword: 'project 1',
					case_sensitive: false,
					board_id: 'p1',
					board: { id: 'p1', name: 'Project 1', alias: 'p1' },
					tracker_category: null
				},
				{
					id: '2',
					keyword: 'project 2',
					case_sensitive: false,
					board_id: 'p2',
					board: { id: 'p2', name: 'Project 2', alias: 'p2' },
					tracker_category: null
				}
			];

			const stats = trackerStatsStore.calculateStats(
				[
					{
						id: 1,
						window_title: 'project 1 task',
						start_time: '2025-01-01T10:00:00Z',
						duration_seconds: 3600 // 60%
					},
					{
						id: 2,
						window_title: 'project 2 task',
						start_time: '2025-01-01T11:00:00Z',
						duration_seconds: 2400 // 40%
					}
				],
				keywords,
				new Date('2025-01-01T00:00:00Z'),
				new Date('2025-01-02T00:00:00Z')
			);

			expect(stats.byProject.get('p1')?.percentage).toBeCloseTo(60, 1);
			expect(stats.byProject.get('p2')?.percentage).toBeCloseTo(40, 1);
		});
	});
});
