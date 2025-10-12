// @file src/lib/utils/cardHelpers.ts
import { z } from 'zod';

/**
 * Validation schema for card editing
 */
export const todoEditSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200).trim(),
	content: z.string().max(10000).optional(),
	due_on: z.string().optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
	min_hours: z.number().positive().nullable().optional(),
	max_hours: z.number().positive().nullable().optional(),
	actual_hours: z.number().positive().nullable().optional(),
	comment_hours: z.string().max(10000).optional()
});

/**
 * Format a date string according to locale
 */
export function formatDate(dateString: string, lang: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString(lang, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Get Tailwind color class for priority level
 */
export function getPriorityColor(priority: string): string {
	switch (priority) {
		case 'high':
			return 'bg-red-500';
		case 'medium':
			return 'bg-orange-500';
		case 'low':
			return 'bg-blue-500';
		default:
			return 'bg-gray-500';
	}
}

/**
 * Get translated priority label
 */
export function getPriorityLabel(
	priority: 'low' | 'medium' | 'high',
	t: (key: string) => string
): string {
	const key = `card.priority_${priority}` as const;
	return t(key);
}

/**
 * Calculate average hours from min and max
 */
export function calculateAverageHours(minHours: number | null, maxHours: number | null): string {
	if (minHours && maxHours) {
		return ((minHours + maxHours) / 2).toFixed(1);
	}
	return '?';
}
