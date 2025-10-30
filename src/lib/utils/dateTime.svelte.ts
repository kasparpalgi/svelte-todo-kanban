/** @file src/lib/utils/dateTime.svelte.ts */
import { t } from '$lib/i18n';

// eg. "today", "yesterday", "5 days ago"
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) return t.get('members.today').toLowerCase();
	if (days === 1) return t.get('members.yesterday').toLowerCase();
	if (days < 7) return `${days} ${t.get('members.days_ago')}`;
	return date.toLocaleDateString();
}

// eg. "tomorrow", "in 5 days", "5 days ago"
export function formatDateWithFuture(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return t.get('date.today');
	if (diffDays === 1) return t.get('date.tomorrow');
	if (diffDays === -1) return t.get('date.yesterday');
	if (diffDays > 0) return `${diffDays} ${t.get('date.in_days')}`;
	return `${Math.abs(diffDays)} ${t.get('date.days_ago')}`;
}

// eg. "3. sugust 2025"
export function formatLocaleDate(
	date: Date | string | number,
	locale: string,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}
): string {
	if (!date) return '';
	const jsDate = new Date(date);
	return new Intl.DateTimeFormat(locale, options).format(jsDate);
}
