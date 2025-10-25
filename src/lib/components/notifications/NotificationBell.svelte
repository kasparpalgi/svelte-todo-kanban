<!-- @file src/lib/components/notifications/NotificationBell.svelte -->
<script lang="ts">
	import { Bell } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import NotificationPanel from './NotificationPanel.svelte';
	import { onMount } from 'svelte';

	const user = $derived(userStore.user);
	const unreadCount = $derived(notificationStore.unreadCount);

	let isOpen = $state(false);

	onMount(async () => {
		if (user?.id) {
			await notificationStore.loadNotifications(user.id);
		}
	});
</script>

<DropdownMenu bind:open={isOpen}>
	<DropdownMenuTrigger>
		<Button
			variant="ghost"
			size="icon"
			class="relative"
		>
			<Bell class="h-5 w-5" />
			{#if unreadCount > 0}
				<span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
					{unreadCount > 99 ? '99+' : unreadCount}
				</span>
			{/if}
		</Button>
	</DropdownMenuTrigger>

	<DropdownMenuContent class="w-80 p-0" align="end">
		<NotificationPanel {isOpen} />
	</DropdownMenuContent>
</DropdownMenu>
