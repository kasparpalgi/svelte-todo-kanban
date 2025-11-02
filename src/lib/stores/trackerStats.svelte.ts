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

export interface SessionBreakdown {
	sessionId: number;
	windowTitle: string;
	durationSeconds: number;
	startTime: string;
	matchType: 'project' | 'category' | 'unmatched';
	projectId?: string;
	projectName?: string;
	categoryId?: string;
	categoryName?: string;
	allocatedToProject?: string;
	allocatedToCategory?: string;
	reason: string; // why it was matched/allocated
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
	sessions: SessionBreakdown[]; // for transparency
	matchedPercentage: number; // (matchedSeconds / totalSeconds) * 100
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
	 * Returns the FIRST match (sorted by keyword length, longest first)
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
				};			return { success: true, message: 'Keywords loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
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

			state.categories = data.tracker_categories || [];			return { success: true, message: 'Categories loaded' };
		} catch (error) {
			state.error = error instanceof Error ? error.message : String(error);
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
	 * Sessions longer than this that don't match keywords are excluded entirely
	 */
	function setUnmatchedThreshold(thresholdSeconds: number) {
		state.unmatchedThreshold = thresholdSeconds;
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

		// Load sessions, keywords, and categories in parallel
		await Promise.all([
			loadSessions(startDate, endDate),
			loadKeywords(),
			loadCategories()
		]);

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
