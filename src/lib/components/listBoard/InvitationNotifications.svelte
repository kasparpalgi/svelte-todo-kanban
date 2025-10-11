<!-- @file src/lib/components/listBoard/InvitationNotifications.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Bell, Check, X } from 'lucide-svelte';
	import { invitationsStore } from '$lib/stores/invitations.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { browser } from '$app/environment';

	const invitations = $derived(invitationsStore.myInvitations);
	const pendingCount = $derived(invitationsStore.pendingCount);

	$effect(() => {
		// Load invitations on mount
		invitationsStore.loadMyInvitations();
	});

	async function handleAccept(invitationId: string) {
		const result = await invitationsStore.acceptInvitation(invitationId);

		if (result.success) {
			displayMessage('Invitation accepted! Refreshing page...', 1500, true);
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

	async function handleDecline(invitationId: string) {
		const result = await invitationsStore.declineInvitation(invitationId);

		if (result.success) {
			displayMessage('Invitation declined', 1500, true);
		} else {
			displayMessage(result.message);
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<Button variant="ghost" size="sm" class="relative h-9 w-9 p-0">
			<Bell class="h-5 w-5" />
			{#if pendingCount > 0}
				<Badge
					variant="destructive"
					class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
				>
					{pendingCount}
				</Badge>
			{/if}
		</Button>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-80">
		<div class="p-2">
			<div class="flex items-center justify-between mb-2">
				<h3 class="font-semibold text-sm">Board Invitations</h3>
				{#if pendingCount > 0}
					<Badge variant="secondary" class="text-xs">{pendingCount}</Badge>
				{/if}
			</div>

			{#if invitations.length === 0}
				<div class="py-8 text-center text-sm text-muted-foreground">
					<Bell class="h-8 w-8 mx-auto mb-2 opacity-20" />
					<p>No pending invitations</p>
				</div>
			{:else}
				<div class="space-y-2 max-h-96 overflow-y-auto">
					{#each invitations as invitation (invitation.id)}
						<div class="border rounded-md p-3 space-y-2">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="font-medium text-sm">{invitation.board.name}</div>
									<div class="text-xs text-muted-foreground">
										Invited by {invitation.inviter.name || invitation.inviter.username}
									</div>
									<div class="text-xs text-muted-foreground">
										{formatDate(invitation.created_at)}
									</div>
								</div>
								<Badge variant="outline" class="text-xs">
									{invitation.role}
								</Badge>
							</div>

							<div class="flex gap-2">
								<Button
									size="sm"
									class="flex-1 h-8"
									onclick={() => handleAccept(invitation.id)}
								>
									<Check class="mr-1 h-3 w-3" />
									Accept
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="flex-1 h-8"
									onclick={() => handleDecline(invitation.id)}
								>
									<X class="mr-1 h-3 w-3" />
									Decline
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</DropdownMenuContent>
</DropdownMenu>
