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

	let isOpen = $state(false);

	const user = $derived(userStore.user);
	const notifications = $derived(notificationStore.notifications);
	const unreadCount = $derived(notificationStore.unreadCount);
	const invitations = $derived(invitationsStore.myInvitations);
	const pendingInvitationCount = $derived(invitationsStore.pendingCount);

	const totalCount = $derived(unreadCount + pendingInvitationCount);

	$effect(() => {
		if (!invitationsStore.initialized && !invitationsStore.loading) {
			invitationsStore.loadMyInvitations();
		}
	});

	// Load notifications when bell is opened
	$effect(() => {
		if (isOpen && user?.id) {
			notificationStore.loadNotifications(user.id);
		}
	});

	onMount(() => {
		if (user?.id) {
			notificationStore.loadNotifications(user.id);

			// Poll for new notifications every 30 seconds
			const pollInterval = setInterval(() => {
				if (user?.id) {
					notificationStore.loadNotifications(user.id);
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
		// Check if notification has a related todo with board info
		if (!notification.todo || !notification.todo.list?.board) {
			console.log('[UnifiedNotificationBell.handleNotificationClick] No board info available');
			return;
		}

		const board = notification.todo.list.board;
		const boardAlias = board.alias;
		const username = board.user?.username;
		const cardId = notification.todo_id;

		if (!boardAlias || !username || !cardId) {
			console.log('[UnifiedNotificationBell.handleNotificationClick] Missing required data', {
				boardAlias,
				username,
				cardId
			});
			return;
		}

		// Get current language from URL params
		const lang = getEffectiveLocale($page.params.lang, userStore.user?.locale);

		// Navigate to the card
		const url = `/${lang}/${username}/${boardAlias}?card=${cardId}`;
		console.log('[UnifiedNotificationBell.handleNotificationClick] Navigating to:', url);

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
					class="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2"
				>
					{totalCount > 99 ? '99+' : totalCount}
				</span>
			{/if}
		</Button>
	</DropdownMenuTrigger>

	<DropdownMenuContent align="end" class="w-80 max-h-96 overflow-y-auto">
		<!-- Invitations Section - Pinned to Top -->
		{#if invitations.length > 0}
			<div class="border-b px-4 py-3">
				<h3 class="text-sm font-semibold mb-3 flex items-center justify-between">
					<span>{$t('members.board_invitations')}</span>
					{#if pendingInvitationCount > 0}
						<Badge variant="destructive" class="text-xs">{pendingInvitationCount}</Badge>
					{/if}
				</h3>

				<div class="space-y-2">
					{#each invitations as invitation (invitation.id)}
						<div class="border rounded-md p-2 text-sm">
							<div class="font-medium mb-1">{invitation.board.name}</div>
							<div class="text-xs text-muted-foreground mb-2">
								{$t('members.invited_by')} {invitation.inviter.name || invitation.inviter.username}
							</div>
							<div class="flex gap-2">
								<Button
									size="sm"
									class="h-7 flex-1 text-xs"
									onclick={() => handleAcceptInvitation(invitation.id)}
								>
									<Check class="h-3 w-3 mr-1" />
									{$t('board.accept')}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-7 flex-1 text-xs"
									onclick={() => handleDeclineInvitation(invitation.id)}
								>
									<X class="h-3 w-3 mr-1" />
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
			<div class="flex items-center justify-between mb-3">
				<h3 class="text-sm font-semibold">Notifications</h3>
				{#if unreadCount > 0}
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

			{#if notifications.length === 0}
				<div class="text-center py-4 text-xs text-muted-foreground">
					No notifications
				</div>
			{:else}
				<div class="space-y-2">
					{#each notifications as notification (notification.id)}
						<div
							class="flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer hover:bg-muted/50 transition-colors {!notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
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
							<span class="text-base flex-shrink-0">{getNotificationIcon(notification.type)}</span>

							<div class="flex-1 min-w-0">
								<p class="text-muted-foreground line-clamp-2">
									{formatNotificationMessage(notification)}
								</p>
								<p class="text-muted-foreground text-xs flex items-center gap-1 mt-1">
									<Clock class="h-3 w-3" />
									{formatDatetime(notification.created_at)}
								</p>
							</div>

							<div class="flex gap-1 flex-shrink-0">
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
