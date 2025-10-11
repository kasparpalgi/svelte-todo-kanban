<!-- @file src/lib/components/listBoard/InvitationNotifications.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { browser } from '$app/environment';
	import { invitationsStore } from '$lib/stores/invitations.svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { formatDate } from '$lib/utils/dateTime.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Bell, Check, X } from 'lucide-svelte';

	const invitations = $derived(invitationsStore.myInvitations);
	const pendingCount = $derived(invitationsStore.pendingCount);

	$effect(() => {
		invitationsStore.loadMyInvitations();
	});

	async function handleAccept(invitationId: string) {
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

	async function handleDecline(invitationId: string) {
		const result = await invitationsStore.declineInvitation(invitationId);

		if (result.success) {
			displayMessage($t('members.invitation_declined_message'), 1500, true);
		} else {
			displayMessage(result.message);
		}
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<Button variant="ghost" size="sm" class="relative h-9 w-9 p-0">
			<Bell class="h-5 w-5" />
			{#if pendingCount > 0}
				<Badge
					variant="destructive"
					class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
				>
					{pendingCount}
				</Badge>
			{/if}
		</Button>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-80">
		<div class="p-2">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-semibold">{$t('members.board_invitations')}</h3>
				{#if pendingCount > 0}
					<Badge variant="secondary" class="text-xs">{pendingCount}</Badge>
				{/if}
			</div>

			{#if invitations.length === 0}
				<div class="py-8 text-center text-sm text-muted-foreground">
					<Bell class="mx-auto mb-2 h-8 w-8 opacity-20" />
					<p>{$t('members.no_pending_invitations')}</p>
				</div>
			{:else}
				<div class="max-h-96 space-y-2 overflow-y-auto">
					{#each invitations as invitation (invitation.id)}
						<div class="space-y-2 rounded-md border p-3">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="text-sm font-medium">{invitation.board.name}</div>
									<div class="text-xs text-muted-foreground">
										{$t('members.invited_by')}
										{invitation.inviter.name || invitation.inviter.username}
									</div>
									<div class="text-xs text-muted-foreground">
										{formatDate(invitation.created_at)}
									</div>
								</div>
								<Badge variant="outline" class="text-xs">
									{$t(`board.${invitation.role.toLowerCase()}`)}
								</Badge>
							</div>

							<div class="flex gap-2">
								<Button size="sm" class="h-8 flex-1" onclick={() => handleAccept(invitation.id)}>
									<Check class="mr-1 h-3 w-3" />
									{$t('board.accept')}
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="h-8 flex-1"
									onclick={() => handleDecline(invitation.id)}
								>
									<X class="mr-1 h-3 w-3" />
									{$t('board.decline')}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</DropdownMenuContent>
</DropdownMenu>
