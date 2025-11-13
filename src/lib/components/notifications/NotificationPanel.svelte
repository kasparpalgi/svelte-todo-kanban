<!-- @file src/lib/components/notifications/NotificationPanel.svelte -->
<script lang="ts">
	import { Check, Trash2, Clock } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { isOpen }: { isOpen: boolean } = $props();

	const notifications = $derived(notificationStore.notifications);
	const loading = $derived(notificationStore.loading);
	const unreadNotifications = $derived(notifications.filter((n) => !n.is_read));

	async function handleMarkAsRead(notificationId: string) {
		const result = await notificationStore.markAsRead(notificationId);
		if (!result.success) {
			displayMessage(result.message);
		}
	}

	async function handleDelete(notificationId: string) {
		const result = await notificationStore.deleteNotification(notificationId);
		if (!result.success) {
			displayMessage(result.message);
		}
	}

	async function handleMarkAllAsRead() {
		if (unreadNotifications.length === 0) return;
		const result = await notificationStore.markMultipleAsRead(
			unreadNotifications.map((n) => n.id)
		);
		if (!result.success) {
			displayMessage(result.message);
		}
	}

	function getNotificationIcon(type: string) {
		switch (type) {
			case 'assigned':
				return '👤';
			case 'commented':
				return '💬';
			case 'edited':
				return '✏️';
			case 'image_added':
				return '🖼️';
			case 'image_removed':
				return '🗑️';
			case 'priority_changed':
				return '⚡';
			default:
				return '🔔';
		}
	}

	function formatDate(date: string) {
		const now = new Date();
		const notifDate = new Date(date);
		const diffMs = now.getTime() - notifDate.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return notifDate.toLocaleDateString();
	}

	async function handleNotificationClick(notification: any) {
		// Check if notification has a related todo with board info
		if (!notification.todo || !notification.todo.list?.board) {
			console.log('[NotificationPanel.handleNotificationClick] No board info available');
			return;
		}

		const board = notification.todo.list.board;
		const boardAlias = board.alias;
		const username = board.user?.username;
		const cardId = notification.todo_id;

		if (!boardAlias || !username || !cardId) {
			console.log('[NotificationPanel.handleNotificationClick] Missing required data', {
				boardAlias,
				username,
				cardId
			});
			return;
		}

		// Get current language from URL params
		const lang = $page.params.lang || 'en';

		// Navigate to the card
		const url = `/${lang}/${username}/${boardAlias}?card=${cardId}`;
		console.log('[NotificationPanel.handleNotificationClick] Navigating to:', url);

		// Mark as read when clicking
		if (!notification.is_read) {
			await handleMarkAsRead(notification.id);
		}

		await goto(url);
	}
</script>

<div class="w-full">
	<div class="flex items-center justify-between border-b px-4 py-3">
		<h3 class="font-semibold text-sm">Notifications</h3>
		{#if unreadNotifications.length > 0}
			<Button
				variant="ghost"
				size="sm"
				onclick={handleMarkAllAsRead}
				class="text-xs h-auto py-1 px-2"
			>
				<Check class="h-3 w-3 mr-1" />
				Mark all as read
			</Button>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<p class="text-sm text-muted-foreground">Loading notifications...</p>
		</div>
	{:else if notifications.length === 0}
		<div class="flex items-center justify-center py-8">
			<p class="text-sm text-muted-foreground">No notifications yet</p>
		</div>
	{:else}
		<div class="max-h-96 overflow-y-auto w-full">
			<div class="flex flex-col">
				{#each notifications as notification (notification.id)}
					<div
						class="flex items-start gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer {!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
						onclick={() => handleNotificationClick(notification)}
					>
						<span class="text-xl flex-shrink-0 mt-0.5">
							{getNotificationIcon(notification.type)}
						</span>

						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									{#if notification.todo}
										<p class="text-xs font-semibold line-clamp-1">
											{notification.todo.title}
										</p>
									{/if}
									<p class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
										{notification.content || `${notification.type} notification`}
									</p>
									<p class="text-xs text-muted-foreground flex items-center gap-1 mt-1">
										<Clock class="h-3 w-3" />
										{formatDate(notification.created_at)}
									</p>
								</div>

								<div class="flex gap-1 flex-shrink-0">
									{#if !notification.is_read}
										<Button
											variant="ghost"
											size="icon"
											class="h-7 w-7"
											onclick={(e) => {
												e.stopPropagation();
												handleMarkAsRead(notification.id);
											}}
										>
											<Check class="h-3 w-3" />
										</Button>
									{/if}
									<Button
										variant="ghost"
										size="icon"
										class="h-7 w-7 text-destructive hover:text-destructive"
										onclick={(e) => {
											e.stopPropagation();
											handleDelete(notification.id);
										}}
									>
										<Trash2 class="h-3 w-3" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
