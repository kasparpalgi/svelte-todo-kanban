<!-- @file src/lib/components/listBoard/BoardMembers.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { boardMembersStore } from '$lib/stores/boardMembers.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Users, Trash2, Mail, Clock, X } from 'lucide-svelte';
	import type { MembersProps } from '$lib/types/listBoard';

	let { board, open = $bindable(), onClose }: MembersProps = $props();

	let inviteInput = $state('');
	let inviteRole = $state<'editor' | 'viewer'>('editor');
	let searchResults = $state<any[]>([]);
	let isSearching = $state(false);

	const currentUser = $derived(userStore.user);
	const members = $derived(boardMembersStore.members);
	const invitations = $derived(boardMembersStore.invitations);

	const isOwner = $derived(() => {
		if (!currentUser) return false;
		if (board.user.id === currentUser.id) return true;
		const userMember = members.find((m) => m.user_id === currentUser.id);
		return userMember?.role === 'owner';
	});

	$effect(() => {
		if (open) {
			loadData();
		}
	});

	async function loadData() {
		await boardMembersStore.loadMembers(board.id);
		await boardMembersStore.loadInvitations(board.id);
	}

	async function handleSearch() {
		if (!inviteInput.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		const results = await boardMembersStore.searchUsers(inviteInput);

		searchResults = results.filter((user) => user.id !== currentUser?.id);
		isSearching = false;
	}

	async function handleInvite() {
		if (!inviteInput.trim()) return;

		const result = await boardMembersStore.inviteUser(board.id, inviteInput.trim(), inviteRole);

		if (result.success) {
			displayMessage($t('members.invitation_sent'), 1500, true);
			inviteInput = '';
			searchResults = [];
			await loadData();
		} else {
			displayMessage(result.message);
		}
	}

	async function handleRemoveMember(memberId: string) {
		if (!confirm($t('members.remove_member_confirm'))) return;

		const result = await boardMembersStore.removeMember(memberId);

		if (result.success) {
			displayMessage($t('members.member_removed'), 1500, true);
			await loadData();
		} else {
			displayMessage(result.message);
		}
	}

	async function handleUpdateRole(memberId: string, newRole: 'owner' | 'editor' | 'viewer') {
		const result = await boardMembersStore.updateMemberRole(memberId, newRole);

		if (result.success) {
			displayMessage($t('members.role_updated'), 1500, true);
			await loadData();
		} else {
			displayMessage(result.message);
		}
	}

	async function handleCancelInvitation(invitationId: string) {
		const result = await boardMembersStore.cancelInvitation(invitationId);

		if (result.success) {
			displayMessage($t('members.invitation_cancelled'), 1500, true);
			await loadData();
		} else {
			displayMessage(result.message);
		}
	}

	function getRoleBadgeVariant(role: string) {
		switch (role) {
			case 'owner':
				return 'default';
			case 'editor':
				return 'secondary';
			case 'viewer':
				return 'outline';
			default:
				return 'outline';
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return $t('members.today');
		if (days === 1) return $t('members.yesterday');
		if (days < 7) return $t('members.days_ago', { days });
		return date.toLocaleDateString();
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-h-[80vh] max-w-2xl overflow-y-auto">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Users class="h-5 w-5" />
				{$t('members.board_members')}
			</DialogTitle>
			<DialogDescription>
				{$t('members.manage_access', { boardName: board.name })}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6">
			<!-- Invite Section -->
			{#if isOwner()}
				<Card>
					<CardHeader>
						<CardTitle class="text-sm">{$t('members.invite_users')}</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="flex gap-2">
							<Input
								bind:value={inviteInput}
								placeholder={$t('members.invite_email_username_placeholder')}
								oninput={handleSearch}
								class="flex-1"
							/>
							<select
								bind:value={inviteRole}
								class="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring focus:outline-none"
							>
								<option value="editor">{$t('board.editor')}</option>
								<option value="viewer">{$t('board.viewer')}</option>
							</select>
							<Button onclick={handleInvite} disabled={!inviteInput.trim()}>
								<Mail class="mr-2 h-4 w-4" />
								{$t('members.invite')}
							</Button>
						</div>

						<!-- Search Results -->
						{#if searchResults.length > 0}
							<div class="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
								{#each searchResults as user}
									<button
										class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
										onclick={() => {
											inviteInput = user.username || user.email;
											searchResults = [];
										}}
									>
										{#if user.image}
											<img src={user.image} alt={user.username} class="h-6 w-6 rounded-full" />
										{:else}
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-medium"
											>
												{user.username?.charAt(0)?.toUpperCase() || '?'}
											</div>
										{/if}
										<div>
											<div class="font-medium">@{user.username}</div>
											<div class="text-xs text-muted-foreground">{user.email}</div>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<Card>
				<CardHeader>
					<CardTitle class="flex items-center justify-between text-sm">
						<span>{$t('members.members_count', { count: members.length })}</span>
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					{#each members as member (member.id)}
						<div class="flex items-center gap-3 rounded-md border p-2">
							{#if member.user.image}
								<img src={member.user.image} alt={member.user.name} class="h-8 w-8 rounded-full" />
							{:else}
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium"
								>
									{member.user.name?.charAt(0) || member.user.username?.charAt(0) || '?'}
								</div>
							{/if}

							<div class="flex-1">
								<div class="text-sm font-medium">{member.user.name || member.user.username}</div>
								<div class="text-xs text-muted-foreground">{member.user.email}</div>
							</div>

							<Badge variant={getRoleBadgeVariant(member.role)}>
								{$t(`board.${member.role.toLowerCase()}`)}
							</Badge>

							{#if isOwner() && member.user_id !== currentUser?.id}
								<select
									value={member.role}
									onchange={(e) => handleUpdateRole(member.id, e.currentTarget.value as any)}
									class="h-8 w-24 rounded-md border border-input bg-background px-2 text-xs shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-1 focus:ring-ring focus:outline-none"
								>
									<option value="owner">{$t('board.owner')}</option>
									<option value="editor">{$t('board.editor')}</option>
									<option value="viewer">{$t('board.viewer')}</option>
								</select>

								<Button
									variant="ghost"
									size="sm"
									class="h-8 w-8 p-0"
									onclick={() => handleRemoveMember(member.id)}
								>
									<Trash2 class="h-4 w-4 text-destructive" />
								</Button>
							{/if}
						</div>
					{/each}
				</CardContent>
			</Card>

			{#if invitations.length > 0}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2 text-sm">
							<Clock class="h-4 w-4" />
							{$t('members.pending_invitations_count', { count: invitations.length })}
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						{#each invitations as invitation (invitation.id)}
							<div class="flex items-center gap-3 rounded-md border p-2">
								<Mail class="h-4 w-4 text-muted-foreground" />
								<div class="flex-1">
									<div class="text-sm font-medium">
										{invitation.invitee_email || invitation.invitee_username}
									</div>
									<div class="text-xs text-muted-foreground">
										{$t('members.invited_date', { date: formatDate(invitation.created_at) })}
									</div>
								</div>

								<Badge variant="outline">{$t(`board.${invitation.role.toLowerCase()}`)}</Badge>

								{#if isOwner()}
									<Button
										variant="ghost"
										size="sm"
										class="h-8 w-8 p-0"
										onclick={() => handleCancelInvitation(invitation.id)}
									>
										<X class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={onClose}>{$t('common.close')}</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
