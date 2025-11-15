<!-- @file src/lib/components/activity/BoardActivityList.svelte -->
<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import {
		CheckCircle,
		Circle,
		Edit,
		Trash2,
		MessageSquare,
		Image as ImageIcon,
		UserPlus,
		UserMinus,
		AlertCircle,
		Calendar
	} from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { enUS, et, cs } from 'date-fns/locale';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { logs, onClose }: { logs: any[]; onClose?: () => void } = $props();

	function getActionIcon(actionType: string) {
		switch (actionType) {
			case 'created':
				return Circle;
			case 'completed':
				return CheckCircle;
			case 'uncompleted':
				return Circle;
			case 'updated':
				return Edit;
			case 'deleted':
				return Trash2;
			case 'commented':
			case 'comment_edited':
			case 'comment_deleted':
				return MessageSquare;
			case 'image_added':
			case 'image_removed':
				return ImageIcon;
			case 'assigned':
				return UserPlus;
			case 'unassigned':
				return UserMinus;
			case 'priority_changed':
				return AlertCircle;
			case 'due_date_changed':
				return Calendar;
			default:
				return Edit;
		}
	}

	function getActionColor(actionType: string): string {
		switch (actionType) {
			case 'created':
				return 'text-green-600 dark:text-green-400';
			case 'completed':
				return 'text-blue-600 dark:text-blue-400';
			case 'deleted':
			case 'comment_deleted':
			case 'image_removed':
				return 'text-red-600 dark:text-red-400';
			case 'assigned':
				return 'text-purple-600 dark:text-purple-400';
			case 'priority_changed':
				return 'text-orange-600 dark:text-orange-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}

	function formatActivityDescription(log: any): string {
		const actionKey = `activity.actions.${log.action_type}`;
		const todoTitle = log.todo?.title || 'Unknown task';

		switch (log.action_type) {
			case 'created':
				return `${$t(actionKey)} "${todoTitle}"`;
			case 'completed':
			case 'uncompleted':
			case 'deleted':
				return `${$t(actionKey)} "${todoTitle}"`;
			case 'updated':
				if (log.field_name) {
					return `${$t('activity.actions.updated_field', { field: log.field_name })} in "${todoTitle}"`;
				}
				return `${$t(actionKey)} "${todoTitle}"`;
			case 'commented':
				return `${$t(actionKey)} on "${todoTitle}"`;
			case 'comment_edited':
			case 'comment_deleted':
				return `${$t(actionKey)} on "${todoTitle}"`;
			case 'assigned':
				return `${$t(actionKey)} "${todoTitle}"`;
			case 'unassigned':
				return `${$t(actionKey)} "${todoTitle}"`;
			case 'priority_changed':
				if (log.old_value && log.new_value) {
					return `${$t('activity.actions.priority_changed')} from ${log.old_value} to ${log.new_value} in "${todoTitle}"`;
				}
				return `${$t(actionKey)} in "${todoTitle}"`;
			case 'due_date_changed':
				return `${$t(actionKey)} in "${todoTitle}"`;
			case 'image_added':
			case 'image_removed':
				return `${$t(actionKey)} in "${todoTitle}"`;
			default:
				return `${log.action_type} "${todoTitle}"`;
		}
	}

	function getDateFnsLocale() {
		const currentLocale = $locale;
		switch (currentLocale) {
			case 'et':
				return et;
			case 'cs':
				return cs;
			default:
				return enUS;
		}
	}

	function getRelativeTime(timestamp: string): string {
		try {
			return formatDistanceToNow(new Date(timestamp), {
				addSuffix: true,
				locale: getDateFnsLocale()
			});
		} catch {
			return timestamp;
		}
	}

	function handleActivityClick(log: any) {
		// Don't navigate if the todo was deleted
		if (log.action_type === 'deleted') {
			return;
		}

		// Navigate to the card modal
		if (log.todo_id) {
			// Close the activity modal first
			onClose?.();

			const currentUrl = $page.url;
			const newUrl = new URL(currentUrl);
			newUrl.searchParams.set('card', log.todo_id);
			goto(newUrl.toString());
		}
	}

	function isClickable(log: any): boolean {
		// Only make clickable if the todo still exists (not deleted)
		return log.action_type !== 'deleted' && log.todo_id;
	}
</script>

<div class="space-y-1">
	{#if logs.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			<p>{$t('activity.no_activity')}</p>
		</div>
	{:else}
		{#each logs as log (log.id)}
			{@const Icon = getActionIcon(log.action_type)}
			{@const clickable = isClickable(log)}
			<div
				class="group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50 {clickable
					? 'cursor-pointer'
					: ''}"
				onclick={() => clickable && handleActivityClick(log)}
				role={clickable ? 'button' : undefined}
				tabindex={clickable ? 0 : undefined}
				onkeydown={(e) => {
					if (clickable && (e.key === 'Enter' || e.key === ' ')) {
						e.preventDefault();
						handleActivityClick(log);
					}
				}}
			>
				<div class="mt-0.5 flex-shrink-0">
					<Icon class="h-4 w-4 {getActionColor(log.action_type)}" />
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								{#if log.user?.image}
									<img
										src={log.user.image}
										alt={log.user.name || log.user.username}
										class="h-5 w-5 rounded-full"
									/>
								{/if}
								<span class="font-medium text-sm">
									{log.user?.name || log.user?.username || 'Unknown user'}
								</span>
							</div>
							<p class="mt-1 text-sm text-foreground">
								{formatActivityDescription(log)}
							</p>
							{#if log.todo?.list?.name}
								<p class="mt-0.5 text-xs text-muted-foreground">
									{$t('todo.in')} {log.todo.list.name}
								</p>
							{/if}
						</div>
						<time class="flex-shrink-0 text-xs text-muted-foreground">
							{getRelativeTime(log.created_at)}
						</time>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
