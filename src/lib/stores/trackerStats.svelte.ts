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
				};

				if (kw.board_id && kw.board) {
					result.type = 'project';
					result.projectId = kw.board_id;
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
	 * IMPORTANT: Implements smart context-aware allocation:
	 * 1. Direct matches are allocated to their project/category
	 * 2. Unmatched sessions between two matches of the SAME project are allocated to that project
	 * 3. Unmatched sessions exceeding threshold are completely excluded (breaks)
	 * 4. Other unmatched sessions are shown separately
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
			unmatchedSessionCount: 0,
			sessions: [],
			matchedPercentage: 0
		};

		// First pass: filter by date range and create initial session records with matches
		const filteredSessions: Array<{
			session: any;
			durationSeconds: number;
			match: MatchResult | null;
			matchKey: string | null;
		}> = [];

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

			let matchKey: string | null = null;
			if (match) {
				if (match.type === 'project' && match.projectId) {
					matchKey = `project:${match.projectId}`;
				} else if (match.type === 'category' && match.categoryId) {
					matchKey = `category:${match.categoryId}`;
				}
			}

			filteredSessions.push({
				session,
				durationSeconds,
				match,
				matchKey
			});
		}

		// Second pass: allocate unmatched sessions to surrounding matches of the same project/category
		const sessionsByMatch = new Map<string, { seconds: number; count: number; match: MatchResult }>();
		let totalMatchedSeconds = 0;

		for (let i = 0; i < filteredSessions.length; i++) {
			const current = filteredSessions[i];
			const durationSeconds = current.durationSeconds;

			// If this session has a valid match, process it
			if (current.match && current.matchKey) {
				const existing = sessionsByMatch.get(current.matchKey) || {
					seconds: 0,
					count: 0,
					match: current.match
				};
				existing.seconds += durationSeconds;
				existing.count += 1;
				sessionsByMatch.set(current.matchKey, existing);
				totalMatchedSeconds += durationSeconds;

				// Determine the correct matchType
				let matchType: 'project' | 'category' | 'unmatched' = 'unmatched';
				if (current.match.type === 'project') {
					matchType = 'project';
				} else if (current.match.type === 'category') {
					matchType = 'category';
				}

				const sessionRecord: SessionBreakdown = {
					sessionId: current.session.id,
					windowTitle: current.session.window_title,
					durationSeconds,
					startTime: current.session.start_time,
					matchType,
					projectId: current.match.projectId,
					projectName: current.match.projectName,
					categoryId: current.match.categoryId,
					categoryName: current.match.categoryName,
					allocatedToProject: matchType === 'project' ? current.match.projectName : undefined,
					allocatedToCategory: matchType === 'category' ? current.match.categoryName : undefined,
					reason: `Matched to ${matchType} via keyword: "${current.match.keyword}"`
				};
				stats.sessions.push(sessionRecord);
				continue;
			}

			// This is an unmatched session
			// Check if it exceeds threshold (should be completely excluded)
			if (durationSeconds > thresholdSeconds) {
				const sessionRecord: SessionBreakdown = {
					sessionId: current.session.id,
					windowTitle: current.session.window_title,
					durationSeconds,
					startTime: current.session.start_time,
					matchType: 'unmatched',
					reason: `Unmatched and exceeds threshold (${thresholdSeconds}s), likely break - excluded from tracking`
				};
				stats.sessions.push(sessionRecord);
				continue;
			}

			// Find surrounding matches of the same project/category for context-aware allocation
			let allocatedMatchKey: string | null = null;
			let allocatedMatch: MatchResult | null = null;

			// Look backward for the most recent match
			let lastMatchKey: string | null = null;
			let lastMatch: MatchResult | null = null;
			for (let j = i - 1; j >= 0; j--) {
				if (filteredSessions[j].matchKey) {
					lastMatchKey = filteredSessions[j].matchKey;
					lastMatch = filteredSessions[j].match;
					break;
				}
			}

			// Look forward for the next match
			let nextMatchKey: string | null = null;
			let nextMatch: MatchResult | null = null;
			for (let j = i + 1; j < filteredSessions.length; j++) {
				if (filteredSessions[j].matchKey) {
					nextMatchKey = filteredSessions[j].matchKey;
					nextMatch = filteredSessions[j].match;
					break;
				}
			}

			// If surrounded by the same project/category, allocate to it (context switch)
			if (lastMatchKey && nextMatchKey && lastMatchKey === nextMatchKey) {
				allocatedMatchKey = lastMatchKey;
				allocatedMatch = lastMatch;
			}

			// If no surrounding match found, check if we have a previous match (assume continuing work)
			if (!allocatedMatchKey && lastMatchKey) {
				allocatedMatchKey = lastMatchKey;
				allocatedMatch = lastMatch;
			}

			// Record the session
			const sessionRecord: SessionBreakdown = {
				sessionId: current.session.id,
				windowTitle: current.session.window_title,
				durationSeconds,
				startTime: current.session.start_time,
				matchType: allocatedMatchKey ? 'unmatched' : 'unmatched', // Still marked as unmatched for visibility
				reason: allocatedMatchKey
					? `Context switch between ${allocatedMatch?.type === 'project' ? 'Project ' + allocatedMatch.projectName : 'Category ' + allocatedMatch?.categoryName} sessions`
					: `Unmatched session (below threshold ${thresholdSeconds}s)`
			};

			// If we found an allocated match, add to that project/category
			if (allocatedMatchKey && allocatedMatch) {
				const existing = sessionsByMatch.get(allocatedMatchKey) || {
					seconds: 0,
					count: 0,
					match: allocatedMatch
				};
				existing.seconds += durationSeconds;
				existing.count += 1;
				sessionsByMatch.set(allocatedMatchKey, existing);
				totalMatchedSeconds += durationSeconds;

				if (allocatedMatch.type === 'project') {
					sessionRecord.allocatedToProject = allocatedMatch.projectName;
					sessionRecord.projectId = allocatedMatch.projectId;
				} else {
					sessionRecord.allocatedToCategory = allocatedMatch.categoryName;
					sessionRecord.categoryId = allocatedMatch.categoryId;
				}
			} else {
				// True unmatched session
				stats.unmatchedSeconds += durationSeconds;
				stats.unmatchedSessionCount += 1;
			}

			stats.sessions.push(sessionRecord);
		}

		// Convert map to breakdown structure
		sessionsByMatch.forEach((value, matchKeyStr) => {
			const match: MatchResult = value.match;
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

		// Calculate matched percentage (sessions with keyword matches + allocated context switches)
		stats.matchedPercentage = stats.totalSeconds > 0 ? (totalMatchedSeconds / stats.totalSeconds) * 100 : 0;

		console.log('[TrackerStatsStore.calculateStats]', {
			periodStart: startDate.toISOString(),
			periodEnd: endDate.toISOString(),
			totalSessions: filteredSessions.length,
			totalSeconds: stats.totalSeconds,
			totalSeconds_hours: (stats.totalSeconds / 3600).toFixed(2),
			matchedSeconds: totalMatchedSeconds,
			matchedSeconds_hours: (totalMatchedSeconds / 3600).toFixed(2),
			matchedPercentage: stats.matchedPercentage.toFixed(1) + '%',
			unmatchedSeconds: stats.unmatchedSeconds,
			unmatchedSeconds_hours: (stats.unmatchedSeconds / 3600).toFixed(2),
			unmatchedSessionCount: stats.unmatchedSessionCount,
			projectCount: stats.byProject.size,
			categoryCount: stats.byCategory.size,
			keywordCount: keywords.length,
			threshold_seconds: thresholdSeconds,
			threshold_minutes: Math.round(thresholdSeconds / 60),
			note: 'Unmatched sessions between same project matches are allocated to that project (context-aware)'
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
				limit: 15000,
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
	 * Sessions longer than this that don't match keywords are excluded entirely
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
