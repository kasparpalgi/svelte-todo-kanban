<!-- @file src/lib/components/todo/CardAssignee.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { boardMembersStore } from '$lib/stores/boardMembers.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { actionState } from '$lib/stores/states.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuCheckboxItem,
		DropdownMenuItem
	} from '$lib/components/ui/dropdown-menu';
	import { Users, UserPlus } from 'lucide-svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let { todo }: { todo: TodoFieldsFragment } = $props();
	let isOpen = $state(false);

	const user = $derived(userStore.user);
	const members = $derived(boardMembersStore.members);
	const assignees = $derived(todo.assignees || []);
	const assigneeIds = $derived(new Set(assignees.map((a) => a.user_id)));
	const assigneeCount = $derived(assignees.length);

	onMount(async () => {
		if (todo.list?.board?.id) {
			await boardMembersStore.loadMembers(todo.list.board.id);
		}
	});

	/**
	 * Open the board-management modal so members can be invited/managed.
	 * Closes the card detail dialog first (drop the `?card=` param) so the
	 * management modal isn't stuck behind the card dialog's overlay.
	 */
	function openBoardManagement() {
		isOpen = false;
		if (page.url.searchParams.has('card')) {
			const url = new URL(page.url);
			url.searchParams.delete('card');
			goto(url.pathname + url.search);
		}
		actionState.edit = 'showBoardManagement';
	}

	async function toggleAssignee(userId: string) {
		if (!todo.id) return;

		const isAssigned = assigneeIds.has(userId);

		const result = isAssigned
			? await todosStore.unassignUser(todo.id, userId)
			: await todosStore.assignUser(todo.id, userId);

		if (result.success) {
			displayMessage(isAssigned ? $t('unassigned') : $t('todo.assigned_success'), 1500, true);

			// Notify a newly-assigned user (never the person doing the assigning).
			if (!isAssigned && user?.id && userId !== user.id) {
				try {
					await notificationStore.createNotification({
						user_id: userId,
						todo_id: todo.id,
						type: 'assigned',
						triggered_by_user_id: user.id,
						content: ''
					});
				} catch (error) {
					console.error('Failed to create notification:', error);
				}
			}
		} else {
			displayMessage(result.message);
		}
	}
</script>

<div class="flex items-center gap-2">
	<DropdownMenu bind:open={isOpen}>
		<DropdownMenuTrigger>
			<Button variant="outline" size="sm" class="gap-2" title={$t('todo.assign_to')}>
				<Users class="h-4 w-4" />
				{#if assigneeCount > 0}
					<div class="flex -space-x-2">
						{#each assignees.slice(0, 3) as assignment (assignment.user_id)}
							{@const u = assignment.assignee}
							{#if u.image}
								<img
									src={u.image}
									alt={u.name || u.username}
									class="h-5 w-5 rounded-full border border-background"
								/>
							{:else}
								<div
									class="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted"
								>
									<span class="text-[10px] text-muted-foreground">
										{(u.name || u.username)?.[0]?.toUpperCase()}
									</span>
								</div>
							{/if}
						{/each}
					</div>
					{#if assigneeCount > 3}
						<span class="text-xs text-muted-foreground">+{assigneeCount - 3}</span>
					{/if}
				{:else}
					<span class="text-xs text-muted-foreground">{$t('unassigned')}</span>
				{/if}
			</Button>
		</DropdownMenuTrigger>

		<DropdownMenuContent align="start" class="w-64">
			<DropdownMenuLabel>{$t('todo.assign_to')}:</DropdownMenuLabel>
			<p class="px-2 pb-1 text-xs text-muted-foreground">{$t('todo.assign_hint')}</p>
			<DropdownMenuSeparator />

			{#if members.length === 0}
				<div class="px-2 py-3 text-sm text-muted-foreground">
					{$t('todo.no_board_members')}
				</div>
			{:else}
				<div class="max-h-64 overflow-y-auto">
					{#each members as member (member.id)}
						<DropdownMenuCheckboxItem
							checked={assigneeIds.has(member.user.id)}
							onCheckedChange={() => toggleAssignee(member.user.id)}
						>
							<div class="flex items-center gap-2">
								{#if member.user.image}
									<img
										src={member.user.image}
										alt={member.user.name || member.user.username}
										class="h-5 w-5 rounded-full"
									/>
								{:else}
									<div class="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
										<span class="text-xs text-muted-foreground">
											{(member.user.name || member.user.username)?.[0]?.toUpperCase()}
										</span>
									</div>
								{/if}
								<span class="text-sm">
									{member.user.name || member.user.username}
									{#if member.user.id === user?.id}
										<span class="text-xs text-muted-foreground">({$t('todo.you')})</span>
									{/if}
								</span>
							</div>
						</DropdownMenuCheckboxItem>
					{/each}
				</div>
			{/if}

			<DropdownMenuSeparator />
			<DropdownMenuItem onclick={openBoardManagement}>
				<UserPlus class="mr-2 h-4 w-4" />
				{$t('board.manage_members')}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</div>
