<!-- @file src/lib/components/notifications/UnifiedNotificationBell.svelte -->
<script lang="ts">
	import { Bell } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { invitationsStore } from '$lib/stores/invitations.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { getEffectiveLocale } from '$lib/constants/locale';
	import { t } from '$lib/i18n';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { Check, X, Trash2, Clock } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';

	let isOpen = $state(false);
	let newsDialogOpen = $state(false);
	let newsDialogItem = $state<{ title: string; body: string; url?: string | null } | null>(null);

	const user = $derived(userStore.user);
	const notifications = $derived(notificationStore.notifications);
	const unreadCount = $derived(notificationStore.unreadCount);
	const invitations = $derived(invitationsStore.myInvitations);
	const pendingInvitationCount = $derived(invitationsStore.pendingCount);

	const totalCount = $derived(unreadCount + pendingInvitationCount);

	$effect(() => {
		if (!invitationsStore.initialized && !invitationsStore.loading) {
			invitationsStore
				.loadMyInvitations()
				.catch((e) => console.error('[NotificationBell] loadMyInvitations error:', e));
		}
	});

	// Load notifications when bell is opened
	$effect(() => {
		if (isOpen && user?.id) {
			notificationStore
				.loadNotifications(user.id)
				.catch((e) => console.error('[NotificationBell] loadNotifications error:', e));
		}
	});

	onMount(() => {
		if (user?.id) {
			notificationStore
				.loadNotifications(user.id)
				.catch((e) => console.error('[NotificationBell] initial loadNotifications error:', e));

			// Poll for new notifications every 30 seconds
			const pollInterval = setInterval(() => {
				if (user?.id) {
					notificationStore
						.loadNotifications(user.id)
						.catch((e) => console.error('[NotificationBell] poll loadNotifications error:', e));
				}
			}, 30000);

			return () => clearInterval(pollInterval);
		}
	});

	async function handleMarkAsRead(notificationId: string) {
		await notificationStore.markAsRead(notificationId);
	}

	async function handleDelete(notificationId: string) {
		await notificationStore.deleteNotification(notificationId);
	}

	async function handleMarkAllAsRead() {
		if (unreadCount === 0) return;
		const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
		await notificationStore.markMultipleAsRead(unreadIds);
	}

	async function handleAcceptInvitation(invitationId: string) {
		const result = await invitationsStore.acceptInvitation(invitationId);
		if (result.success) {
			displayMessage($t('members.invitation_accepted_message'), 1500, true);
			await listsStore.loadBoards();
			if (browser) {
				setTimeout(() => {
					window.location.reload();
				}, 500);
			}
		} else {
			displayMessage(result.message);
		}
	}

	async function handleDeclineInvitation(invitationId: string) {
		const result = await invitationsStore.declineInvitation(invitationId);
		if (result.success) {
			displayMessage($t('members.invitation_declined_message'), 1500, true);
		} else {
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
			case 'news':
				return '📢';
			default:
				return '🔔';
		}
	}

	function formatDatetime(date: string) {
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

	function getFirstName(fullName: string | null | undefined): string {
		if (!fullName) return 'Someone';
		return fullName.split(' ')[0];
	}

	function formatNotificationMessage(notification: any): string {
		const userName = getFirstName(notification.triggered_by_user?.name);
		const cardTitle = notification.todo?.title || 'card';

		// Extract the text content from notification content if it exists
		let textContent = '';
		if (notification.content) {
			// Extract quoted content if exists (e.g., from comments)
			const quoteMatch = notification.content.match(/"([^"]+)"/);
			if (quoteMatch) {
				textContent = quoteMatch[1].substring(0, 30) + (quoteMatch[1].length > 30 ? '...' : '');
			}
		}

		switch (notification.type) {
			case 'commented':
				return `${userName} commented ${textContent ? `"${textContent}"` : ''} ${$t('notifications.on_card')} "${cardTitle}"`;
			case 'assigned':
				return `${userName} ${$t('notifications.assigned')} "${cardTitle}"`;
			case 'edited':
				return `${userName} ${$t('notifications.edited')} "${cardTitle}"`;
			case 'image_added':
				return `${userName} ${$t('notifications.image_added')} ${$t('notifications.on_card')} "${cardTitle}"`;
			case 'image_removed':
				return `${userName} ${$t('notifications.image_removed')} ${$t('notifications.on_card')} "${cardTitle}"`;
			case 'comment_edited':
				return `${userName} ${$t('notifications.comment_edited')} ${$t('notifications.on_card')} "${cardTitle}"`;
			case 'comment_removed':
				return `${userName} ${$t('notifications.comment_removed')} ${$t('notifications.on_card')} "${cardTitle}"`;
			case 'priority_changed':
				return `${userName} ${$t('notifications.priority_changed')} ${$t('notifications.on_card')} "${cardTitle}"`;
			default:
				return notification.content || `${notification.type} notification`;
		}
	}

	async function handleNotificationClick(notification: any) {
		if (notification.type === 'news') {
			if (!notification.is_read) {
				await handleMarkAsRead(notification.id);
			}
			newsDialogItem = {
				title: notification.news?.title || notification.content || 'News',
				body: notification.news?.body || '',
				url: notification.news?.url
			};
			newsDialogOpen = true;
			isOpen = false;
			return;
		}

		// Check if notification has a related todo with board info
		if (!notification.todo || !notification.todo.list?.board) {
			return;
		}

		const board = notification.todo.list.board;
		const boardAlias = board.alias;
		const username = board.user?.username;
		const cardAlias = notification.todo.alias;

		if (!boardAlias || !username || !cardAlias) {
			return;
		}

		// Get current language from URL params
		const lang = getEffectiveLocale($page.params.lang, userStore.user?.locale);

		// Navigate to the card
		const url = `/${lang}/${username}/${boardAlias}?card=${cardAlias}`;

		// Mark as read when clicking
		if (!notification.is_read) {
			await handleMarkAsRead(notification.id);
		}

		// Close the dropdown
		isOpen = false;

		await goto(url);
	}
</script>

<DropdownMenu bind:open={isOpen}>
	<DropdownMenuTrigger>
		<Button variant="ghost" size="icon" class="relative h-9 w-9">
			<Bell class="h-5 w-5" />
			{#if totalCount > 0}
				<span
					class="absolute top-0 right-0 inline-flex h-5 w-5 translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
				>
					{totalCount > 99 ? '99+' : totalCount}
				</span>
			{/if}
		</Button>
	</DropdownMenuTrigger>

	<DropdownMenuContent align="end" class="max-h-96 w-80 overflow-y-auto">
		<!-- Invitations Section - Pinned to Top -->
		{#if invitations.length > 0}
			<div class="border-b px-4 py-3">
				<h3 class="mb-3 flex items-center justify-between text-sm font-semibold">
					<span>{$t('members.board_invitations')}</span>
					{#if pendingInvitationCount > 0}
						<Badge variant="destructive" class="text-xs">{pendingInvitationCount}</Badge>
					{/if}
				</h3>

				<div class="space-y-2">
					{#each invitations as invitation (invitation.id)}
						<div class="rounded-md border p-2 text-sm">
							<div class="mb-1 font-medium">{invitation.board.name}</div>
							<div class="mb-2 text-xs text-muted-foreground">
								{$t('members.invited_by')}
								{invitation.inviter.name || invitation.inviter.username}
							</div>
							<div class="flex gap-2">
								<Button
									size="sm"
									class="h-7 flex-1 text-xs"
									onclick={() => handleAcceptInvitation(invitation.id)}
								>
									<Check class="mr-1 h-3 w-3" />
									{$t('board.accept')}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-7 flex-1 text-xs"
									onclick={() => handleDeclineInvitation(invitation.id)}
								>
									<X class="mr-1 h-3 w-3" />
									{$t('board.decline')}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Notifications Section -->
		<div class="px-4 py-3">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-sm font-semibold">Notifications</h3>
				{#if unreadCount > 0}
					<Button
						variant="ghost"
						size="sm"
						onclick={handleMarkAllAsRead}
						class="h-auto px-2 py-1 text-xs"
					>
						<Check class="mr-1 h-3 w-3" />
						Mark all as read
					</Button>
				{/if}
			</div>

			{#if notifications.length === 0}
				<div class="py-4 text-center text-xs text-muted-foreground">No notifications</div>
			{:else}
				<div class="space-y-2">
					{#each notifications as notification (notification.id)}
						<div
							class="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs transition-colors hover:bg-muted/50 {!notification.is_read
								? 'bg-blue-50 dark:bg-blue-950/20'
								: ''}"
							onclick={() => handleNotificationClick(notification)}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleNotificationClick(notification);
								}
							}}
						>
							<span class="flex-shrink-0 text-base">{getNotificationIcon(notification.type)}</span>

							<div class="min-w-0 flex-1">
								<p class="line-clamp-2 text-muted-foreground">
									{formatNotificationMessage(notification)}
								</p>
								<p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
									<Clock class="h-3 w-3" />
									{formatDatetime(notification.created_at)}
								</p>
							</div>

							<div class="flex flex-shrink-0 gap-1">
								{#if !notification.is_read}
									<Button
										variant="ghost"
										size="icon"
										class="h-6 w-6"
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
									class="h-6 w-6 text-destructive hover:text-destructive"
									onclick={(e) => {
										e.stopPropagation();
										handleDelete(notification.id);
									}}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</DropdownMenuContent>
</DropdownMenu>

<Dialog bind:open={newsDialogOpen}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>📢 {newsDialogItem?.title}</DialogTitle>
			<DialogDescription class="pt-2 whitespace-pre-wrap text-foreground">
				{newsDialogItem?.body}
			</DialogDescription>
		</DialogHeader>
		{#if newsDialogItem?.url}
			<a
				href={newsDialogItem.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-primary hover:underline"
			>
				{newsDialogItem.url}
			</a>
		{/if}
	</DialogContent>
</Dialog>
