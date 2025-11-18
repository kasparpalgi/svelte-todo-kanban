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
		Calendar,
		MoveRight,
		Clock,
		FileText
	} from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { enUS, et, cs } from 'date-fns/locale';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { logs, onClose }: { logs: any[]; onClose?: () => void } = $props();

	let selectedActivity = $state<any>(null);

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
			case 'list_moved':
				return MoveRight;
			case 'title_changed':
				return Edit;
			case 'content_updated':
				return FileText;
			case 'hours_changed':
				return Clock;
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
			case 'list_moved':
				return 'text-indigo-600 dark:text-indigo-400';
			case 'title_changed':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'hours_changed':
				return 'text-teal-600 dark:text-teal-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}

	function formatActivityDescription(log: any): string {
		const descKey = `activity.descriptions.${log.action_type}`;
		const todoTitle = log.todo?.title || 'Unknown task';

		// Check if we have old and new values for detailed descriptions
		if (log.old_value && log.new_value) {
			return $t(descKey, {
				title: todoTitle,
				oldValue: log.old_value,
				newValue: log.new_value
			});
		}

		// For comments, show comment preview if available
		if (log.action_type === 'commented' && log.new_value) {
			return $t(descKey, { title: todoTitle }) + ': "' + log.new_value + '"';
		}

		// For comment edits, show old/new if available
		if (log.action_type === 'comment_edited') {
			return $t(descKey, { title: todoTitle });
		}

		// For hours changed, the old_value contains the summary
		if (log.action_type === 'hours_changed' && log.old_value) {
			return $t(descKey, {
				oldValue: log.old_value,
				title: todoTitle
			});
		}

		// Default: use simple description with title
		return $t(descKey, { title: todoTitle });
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
		// Show detail slide-out instead of navigating directly
		selectedActivity = log;
	}

	function navigateToCard(log: any) {
		// Don't navigate if the todo was deleted
		if (log.action_type === 'deleted') {
			return;
		}

		// Navigate to the card modal
		if (log.todo?.alias) {
			// Close the activity modal and detail view
			selectedActivity = null;
			onClose?.();

			const currentUrl = $page.url;
			const newUrl = new URL(currentUrl);
			newUrl.searchParams.set('card', log.todo.alias);
			goto(newUrl.toString());
		}
	}

	function isClickable(log: any): boolean {
		// All activities are clickable to view details
		return true;
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
			<div
				class="group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50 cursor-pointer"
				onclick={() => handleActivityClick(log)}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
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

<!-- Activity Detail Slide-out -->
{#if selectedActivity}
	{@const Icon = getActionIcon(selectedActivity.action_type)}
	<div
		class="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out"
		role="dialog"
		aria-modal="true"
	>
		<div class="flex h-full flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between border-b p-4">
				<h3 class="text-lg font-semibold">Activity Details</h3>
				<button
					onclick={() => (selectedActivity = null)}
					class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
					<span class="sr-only">Close</span>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">

				<!-- Action Type -->
				<div class="mb-4">
					<div class="flex items-center gap-2">
						<Icon class="h-6 w-6 {getActionColor(selectedActivity.action_type)}" />
						<span class="text-lg font-medium capitalize">{selectedActivity.action_type.replace(/_/g, ' ')}</span>
					</div>
				</div>

				<!-- User Info -->
				<div class="mb-4 rounded-lg bg-muted p-3">
					<p class="mb-1 text-xs font-medium text-muted-foreground">Performed by</p>
					<div class="flex items-center gap-2">
						{#if selectedActivity.user?.image}
							<img
								src={selectedActivity.user.image}
								alt={selectedActivity.user.name || selectedActivity.user.username}
								class="h-8 w-8 rounded-full"
							/>
						{/if}
						<div>
							<p class="font-medium">
								{selectedActivity.user?.name || selectedActivity.user?.username || 'Unknown user'}
							</p>
							<p class="text-xs text-muted-foreground">
								{getRelativeTime(selectedActivity.created_at)}
							</p>
						</div>
					</div>
				</div>

				<!-- Description -->
				<div class="mb-4">
					<p class="mb-1 text-xs font-medium text-muted-foreground">Description</p>
					<p class="text-sm">{formatActivityDescription(selectedActivity)}</p>
				</div>

				<!-- Todo Info -->
				{#if selectedActivity.todo}
					<div class="mb-4 rounded-lg bg-muted p-3">
						<p class="mb-1 text-xs font-medium text-muted-foreground">Task</p>
						<p class="font-medium">{selectedActivity.todo.title || 'Unknown task'}</p>
						{#if selectedActivity.todo.list?.name}
							<p class="mt-1 text-xs text-muted-foreground">
								In: {selectedActivity.todo.list.name}
							</p>
						{/if}
					</div>
				{/if}

				<!-- Field Changes -->
				{#if selectedActivity.field_name || selectedActivity.old_value || selectedActivity.new_value}
					<div class="mb-4">
						<p class="mb-2 text-xs font-medium text-muted-foreground">Changes</p>

						{#if selectedActivity.field_name}
							<div class="mb-2 rounded-lg bg-muted p-2">
								<p class="text-xs text-muted-foreground">Field</p>
								<p class="text-sm font-medium">{selectedActivity.field_name}</p>
							</div>
						{/if}

						{#if selectedActivity.old_value}
							<div class="mb-2 rounded-lg bg-red-50 p-2 dark:bg-red-950/20">
								<p class="text-xs text-muted-foreground">Old Value</p>
								<p class="text-sm">{selectedActivity.old_value}</p>
							</div>
						{/if}

						{#if selectedActivity.new_value}
							<div class="mb-2 rounded-lg bg-green-50 p-2 dark:bg-green-950/20">
								<p class="text-xs text-muted-foreground">New Value</p>
								<p class="text-sm">{selectedActivity.new_value}</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Additional Changes (JSON) -->
				{#if selectedActivity.changes}
					<div class="mb-4">
						<p class="mb-2 text-xs font-medium text-muted-foreground">Additional Details</p>
						<div class="rounded-lg bg-muted p-3">
							<pre class="whitespace-pre-wrap text-xs">{JSON.stringify(selectedActivity.changes, null, 2)}</pre>
						</div>
					</div>
				{/if}

				<!-- Timestamp -->
				<div class="mb-4">
					<p class="mb-1 text-xs font-medium text-muted-foreground">Timestamp</p>
					<p class="text-sm">{new Date(selectedActivity.created_at).toLocaleString()}</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="border-t p-4">
				{#if selectedActivity.action_type !== 'deleted' && selectedActivity.todo?.alias}
					<button
						onclick={() => navigateToCard(selectedActivity)}
						class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Go to Task
					</button>
				{:else}
					<p class="text-center text-sm text-muted-foreground">
						Task no longer available
					</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50"
		onclick={() => (selectedActivity = null)}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				selectedActivity = null;
			}
		}}
		role="button"
		tabindex="-1"
	></div>
{/if}
