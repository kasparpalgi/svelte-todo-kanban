/** @file src/lib/utils/cardHelpers.ts  */
import { z } from 'zod';

export const todoEditSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200).trim(),
	content: z.string().max(10000).optional(),
	due_on: z.string().optional(),
	has_time: z.boolean().optional(),
	priority: z.enum(['low', 'medium', 'high']).nullable(),
	min_hours: z.number().positive().nullable().optional(),
	max_hours: z.number().positive().nullable().optional(),
	actual_hours: z.number().positive().nullable().optional(),
	comment_hours: z.string().max(10000).optional()
});

export function formatDate(dateString: string, lang: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString(lang, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

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

export function getPriorityLabel(
	priority: 'low' | 'medium' | 'high',
	t: (key: string) => string
): string {
	const key = `card.priority_${priority}` as const;
	return t(key);
}

export function calculateAverageHours(minHours: number | null, maxHours: number | null): string {
	if (minHours && maxHours) {
		return ((minHours + maxHours) / 2).toFixed(1);
	}
	return '?';
}
