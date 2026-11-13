/** @file src/lib/server/ops/cardActivity.ts */
// The activity row a card edit writes, worked out on the server from the stored row
// (the browser used to send it, and could send anything). One row per edit, for the
// first change in this order, the same order as before #229.
import type { Card } from './cardAccess';

type Set = Partial<{
	completed_at: string | null;
	priority: string | null;
	due_on: string | null;
	has_time: boolean;
	assigned_to: string | null;
	list_id: string | null;
	title: string;
	content: string | null;
	min_hours: number | null;
	max_hours: number | null;
	actual_hours: number | null;
	comment_hours: string | null;
}>;

export type ActivityRow = {
	action_type: string;
	field_name?: string;
	old_value?: string;
	new_value?: string;
	changes?: Record<string, unknown>;
};

const HOURS = ['min_hours', 'max_hours', 'actual_hours', 'comment_hours'] as const;

/** `newListName` is the target list's name when the edit moves the card. */
export function cardActivity(old: Card, set: Set, newListName?: string): ActivityRow | null {
	const changed = <K extends keyof Set>(key: K) =>
		set[key] !== undefined && set[key] !== (old as Record<string, unknown>)[key];

	if (set.completed_at !== undefined) {
		return { action_type: set.completed_at ? 'completed' : 'uncompleted' };
	}
	if (changed('priority')) {
		return {
			action_type: 'priority_changed',
			field_name: 'priority',
			old_value: old.priority || 'none',
			new_value: set.priority || 'none'
		};
	}
	if (changed('due_on')) {
		return {
			action_type: 'due_date_changed',
			field_name: 'due_on',
			old_value: old.due_on || 'none',
			new_value: set.due_on || 'none',
			...(set.has_time !== undefined && {
				changes: { has_time: { old: old.has_time || false, new: set.has_time } }
			})
		};
	}
	if (changed('assigned_to')) {
		return {
			action_type: set.assigned_to ? 'assigned' : 'unassigned',
			field_name: 'assigned_to',
			old_value: old.assigned_to || '',
			new_value: set.assigned_to || '',
			changes: { assignee_id: set.assigned_to }
		};
	}
	if (changed('list_id')) {
		return {
			action_type: 'list_moved',
			field_name: 'list_id',
			old_value: old.list?.name || 'Unknown',
			new_value: newListName || 'Unknown',
			changes: { old_list_id: old.list_id, new_list_id: set.list_id }
		};
	}
	if (changed('title')) {
		return {
			action_type: 'title_changed',
			field_name: 'title',
			old_value: old.title || '',
			new_value: set.title || ''
		};
	}
	if (changed('content')) {
		// The body itself is not copied into the log.
		return {
			action_type: 'content_updated',
			field_name: 'content',
			old_value: 'Content updated',
			new_value: 'Content updated'
		};
	}
	const hours = HOURS.filter((key) => changed(key));
	if (hours.length) {
		const summary = `Updated ${HOURS.filter((key) => set[key] !== undefined)
			.map((key) => key.replace('_hours', ''))
			.join(', ')} hours`;
		return {
			action_type: 'hours_changed',
			field_name: 'time_tracking',
			old_value: summary,
			new_value: summary,
			changes: Object.fromEntries(
				HOURS.map((key) => [
					key,
					{ old: old[key], new: set[key] !== undefined ? set[key] : old[key] }
				])
			)
		};
	}
	return null;
}
