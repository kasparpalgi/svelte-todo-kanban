import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import {
	GET_TRACKER_SESSIONS,
	GET_TRACKER_KEYWORDS,
	GET_TRACKER_CATEGORIES
} from '$lib/graphql/documents';
import type {
	GetTrackerSessionsQuery,
	GetTrackerKeywordsQuery,
	GetTrackerCategoriesQuery
} from '$lib/graphql/generated/graphql';

export interface TimeBreakdown {
	projectId?: string;
	projectName?: string;
	categoryId?: string;
	categoryName?: string;
	parentCategoryId?: string;
	parentCategoryName?: string;
	taskTitle?: string;
	totalSeconds: number;
	percentage: number;
	sessionCount: number;
}

export interface StatsPeriod {
	startDate: Date;
	endDate: Date;
	totalSeconds: number;
	byProject: Map<string, TimeBreakdown>;
	byCategory: Map<string, TimeBreakdown>;
	byTask: Map<string, TimeBreakdown>;
	unmatchedSeconds: number;
	unmatchedSessionCount: number;
}

export interface TrackerStatsState {
	sessions: any[];
	keywords: any[];
	categories: any[];
	loading: boolean;
	error: string | null;
	stats: StatsPeriod | null;
	unmatchedThreshold: number; // in seconds, default 3600 (60 minutes)
}

interface MatchResult {
	type: 'project' | 'category' | 'task' | 'unknown';
	projectId?: string;
	projectName?: string;
	categoryId?: string;
	categoryName?: string;
	parentCategoryId?: string;
	parentCategoryName?: string;
	taskTitle?: string;
	keyword: string;
	caseSensitive: boolean;
}

function createTrackerStatsStore() {
	const state = $state<TrackerStatsState>({
		sessions: [],
		keywords: [],
		categories: [],
		loading: false,
		error: null,
		stats: null,
		unmatchedThreshold: 3600 // 60 minutes default
	});

	/**
	 * Match a window title against keywords to determine project/category/task
	 */
	function matchWindowTitle(windowTitle: string, keywords: any[]): MatchResult | null {
		if (!windowTitle) return null;

		// Sort keywords by length (longest first) to match more specific keywords first
		const sortedKeywords = [...keywords].sort((a, b) => b.keyword.length - a.keyword.length);

		for (const kw of sortedKeywords) {
			const searchStr = kw.case_sensitive ? windowTitle : windowTitle.toLowerCase();
			const keywordStr = kw.case_sensitive ? kw.keyword : kw.keyword.toLowerCase();

			if (searchStr.includes(keywordStr)) {
				const result: MatchResult = {
					type: 'unknown',
					keyword: kw.keyword,
					caseSensitive: kw.case_sensitive
				};

				if (kw.board_id && kw.board) {
					result.type = 'project';
					result.projectId = kw.board_id;
					// Use board name if available, otherwise fall back to keyword
					result.projectName = kw.board.name || kw.keyword;
				} else if (kw.tracker_category) {
					result.type = 'category';
					result.categoryId = kw.tracker_category.id;
					result.categoryName = kw.tracker_category.name;

					if (kw.tracker_category.parent_category) {
						result.parentCategoryId = kw.tracker_category.parent_category.id;
						result.parentCategoryName = kw.tracker_category.parent_category.name;
					}
				}

				return result;
			}
		}

		return null;
	}

	/**
	 * Calculate time breakdown for a date range
	 * Filters sessions within date range and matches them to projects/categories
	 * Unmatched sessions longer than threshold are excluded from stats
	 */
	function calculateStats(sessions: any[], keywords: any[], startDate: Date, endDate: Date, thresholdSeconds: number = 3600): StatsPeriod {
		const stats: StatsPeriod = {
			startDate,
			endDate,
			totalSeconds: 0,
			byProject: new Map(),
			byCategory: new Map(),
			byTask: new Map(),
			unmatchedSeconds: 0,
			unmatchedSessionCount: 0
		};

		const sessionsByMatch = new Map<string, { seconds: number; count: number }>();
		let totalMatchedSeconds = 0;

		for (const session of sessions) {
			const sessionTime = new Date(session.start_time);

			// Filter by date range
			if (sessionTime < startDate || sessionTime > endDate) {
				continue;
			}

			const durationSeconds = session.duration_seconds || 0;
			stats.totalSeconds += durationSeconds;

			// Try to match the window title
			const match = matchWindowTitle(session.window_title, keywords);

			if (!match) {
				// No match - only add if below threshold
				// Sessions > threshold are likely breaks, context switches, etc
				if (durationSeconds <= thresholdSeconds) {
					stats.unmatchedSeconds += durationSeconds;
					stats.unmatchedSessionCount += 1;
				}
				continue;
			}

			// Create unique key for this match (use projectId or categoryId as primary identifier)
			let matchKey: string;
			if (match.type === 'project' && match.projectId) {
				matchKey = `project:${match.projectId}`;
			} else if (match.type === 'category' && match.categoryId) {
				matchKey = `category:${match.categoryId}`;
			} else {
				// Fallback to full JSON for unknown types
				matchKey = JSON.stringify(match);
			}

			const existing = sessionsByMatch.get(matchKey) || {
				seconds: 0,
				count: 0,
				match: match
			} as any;
			existing.seconds += durationSeconds;
			existing.count += 1;
			if (!existing.match) existing.match = match;
			sessionsByMatch.set(matchKey, existing);
			totalMatchedSeconds += durationSeconds;
		}

		// Convert map to breakdown structure
		sessionsByMatch.forEach((value, matchKeyStr) => {
			const match: MatchResult = (value as any).match || JSON.parse(matchKeyStr);
			const percentage =
				stats.totalSeconds > 0 ? (value.seconds / stats.totalSeconds) * 100 : 0;

			const breakdown: TimeBreakdown = {
				totalSeconds: value.seconds,
				percentage,
				sessionCount: value.count
			};

			if (match.type === 'project' && match.projectId && match.projectName) {
				breakdown.projectId = match.projectId;
				breakdown.projectName = match.projectName;
				stats.byProject.set(match.projectId, breakdown);
			} else if (match.type === 'category' && match.categoryId && match.categoryName) {
				breakdown.categoryId = match.categoryId;
				breakdown.categoryName = match.categoryName;
				breakdown.parentCategoryId = match.parentCategoryId;
				breakdown.parentCategoryName = match.parentCategoryName;
				stats.byCategory.set(match.categoryId, breakdown);
			}
		});

		console.log('[TrackerStatsStore.calculateStats]', {
			periodStart: startDate.toISOString(),
			periodEnd: endDate.toISOString(),
			totalSessions: sessions.length,
			totalSeconds: stats.totalSeconds,
			totalSeconds_hours: (stats.totalSeconds / 3600).toFixed(2),
			matchedSeconds: totalMatchedSeconds,
			matchedSeconds_hours: (totalMatchedSeconds / 3600).toFixed(2),
			matchedPercentage: totalMatchedSeconds > 0 ? ((totalMatchedSeconds / stats.totalSeconds) * 100).toFixed(1) + '%' : '0%',
			unmatchedSeconds: stats.unmatchedSeconds,
			unmatchedSeconds_hours: (stats.unmatchedSeconds / 3600).toFixed(2),
			unmatchedSessionCount: stats.unmatchedSessionCount,
			projectCount: stats.byProject.size,
			categoryCount: stats.byCategory.size,
			keywordCount: keywords.length
		});

		return stats;
	}

	/**
	 * Load tracker sessions for a date range
	 */
	async function loadSessions(startDate: Date, endDate: Date) {
		if (!browser) return { success: false, message: 'Not in browser' };

		state.loading = true;
		state.error = null;

		try {
			const data = (await request(GET_TRACKER_SESSIONS, {
				where: {
					start_time: {
						_gte: startDate.toISOString(),
						_lte: endDate.toISOString()
					}
				},
				order_by: [{ start_time: 'desc' }],
				limit: 5000,
				offset: 0
			})) as GetTrackerSessionsQuery;

			state.sessions = data.tracker_sessions || [];
			console.log('[TrackerStatsStore.loadSessions]', {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				sessionCount: state.sessions.length,
				totalDuration: data.tracker_sessions_aggregate?.aggregate?.sum?.duration_seconds || 0
			});

			return { success: true, message: 'Sessions loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			console.log('[TrackerStatsStore.loadSessions] Error:', state.error);
			return { success: false, message: state.error };
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Load all tracker keywords
	 */
	async function loadKeywords() {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data = (await request(GET_TRACKER_KEYWORDS, {
				limit: 5000,
				offset: 0
			})) as GetTrackerKeywordsQuery;

			state.keywords = data.tracker_keywords || [];
			console.log('[TrackerStatsStore.loadKeywords]', {
				keywordCount: state.keywords.length
			});

			return { success: true, message: 'Keywords loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			console.log('[TrackerStatsStore.loadKeywords] Error:', state.error);
			return { success: false, message: state.error };
		}
	}

	/**
	 * Load all tracker categories
	 */
	async function loadCategories() {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const data = (await request(GET_TRACKER_CATEGORIES, {
				limit: 5000,
				offset: 0
			})) as GetTrackerCategoriesQuery;

			state.categories = data.tracker_categories || [];
			console.log('[TrackerStatsStore.loadCategories]', {
				categoryCount: state.categories.length
			});

			return { success: true, message: 'Categories loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
			console.log('[TrackerStatsStore.loadCategories] Error:', state.error);
			return { success: false, message: state.error };
		}
	}

	/**
	 * Calculate stats for a date range
	 * Must call loadSessions and loadKeywords first
	 */
	function getStats(startDate: Date, endDate: Date): StatsPeriod | null {
		if (state.sessions.length === 0 || state.keywords.length === 0) {
			return null;
		}

		state.stats = calculateStats(state.sessions, state.keywords, startDate, endDate, state.unmatchedThreshold);
		return state.stats;
	}

	/**
	 * Set the threshold for unmatched sessions (in seconds)
	 * Sessions longer than this that don't match keywords are excluded
	 */
	function setUnmatchedThreshold(thresholdSeconds: number) {
		state.unmatchedThreshold = thresholdSeconds;
		console.log('[TrackerStatsStore.setUnmatchedThreshold]', {
			thresholdSeconds,
			thresholdMinutes: (thresholdSeconds / 60).toFixed(0)
		});
	}

	/**
	 * Get stats for different time periods
	 */
	async function loadStatsPeriod(period: 'today' | 'week' | 'month') {
		const now = new Date();
		const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
		let startDate: Date;

		switch (period) {
			case 'today':
				startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
				break;
			case 'week':
				startDate = new Date(now);
				startDate.setDate(startDate.getDate() - 7);
				startDate.setHours(0, 0, 0, 0);
				break;
			case 'month':
				startDate = new Date(now);
				startDate.setDate(startDate.getDate() - 30);
				startDate.setHours(0, 0, 0, 0);
				break;
		}

		// Load sessions and keywords in parallel
		await Promise.all([loadSessions(startDate, endDate), loadKeywords()]);

		// Calculate stats
		return getStats(startDate, endDate);
	}

	/**
	 * Format seconds to human-readable time string
	 */
	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	return {
		// State
		get sessions() {
			return state.sessions;
		},
		get keywords() {
			return state.keywords;
		},
		get categories() {
			return state.categories;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get stats() {
			return state.stats;
		},
		get unmatchedThreshold() {
			return state.unmatchedThreshold;
		},

		// Methods
		loadSessions,
		loadKeywords,
		loadCategories,
		getStats,
		loadStatsPeriod,
		setUnmatchedThreshold,
		formatTime,
		calculateStats
	};
}

export const trackerStatsStore = createTrackerStatsStore();
