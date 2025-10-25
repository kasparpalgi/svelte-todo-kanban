<!-- @file src/lib/components/todo/CardAssignee.svelte -->
<script lang="ts">
	import { User } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuCheckboxItem
	} from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { boardMembersStore } from '$lib/stores/boardMembers.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { notificationStore } from '$lib/stores/notifications.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import { onMount } from 'svelte';

	let { todo }: { todo: TodoFieldsFragment } = $props();
	let isOpen = $state(false);

	const user = $derived(userStore.user);
	const members = $derived(boardMembersStore.members);
	const assignee = $derived(todo.assignee);

	onMount(async () => {
		// Load board members when this component mounts
		if (todo.list?.board?.id) {
			await boardMembersStore.loadMembers(todo.list.board.id);
		}
	});

	async function assignUser(memberId: string | null) {
		if (!todo.id) return;

		const result = await todosStore.updateTodo(todo.id, {
			assigned_to: memberId
		});

		if (result.success) {
			displayMessage(`User ${memberId ? 'assigned' : 'unassigned'} successfully!`, 1500, true);
			isOpen = false;

			// Create a notification for the assigned user
			if (memberId && user?.id) {
				try {
					await notificationStore.createNotification({
						user_id: memberId,
						todo_id: todo.id,
						type: 'assigned',
						triggered_by_user_id: user.id,
						content: `${user.name || 'Someone'} assigned you a card: ${todo.title}`
					});
					console.log('[CardAssignee.assignUser] Notification created');
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
			<Button
				variant="outline"
				size="sm"
				class="gap-2"
			>
				<User class="h-4 w-4" />
				{#if assignee}
					<span class="text-xs">{assignee.name || assignee.username}</span>
				{:else}
					<span class="text-xs text-muted-foreground">Unassigned</span>
				{/if}
			</Button>
		</DropdownMenuTrigger>

		<DropdownMenuContent align="start" class="w-48">
			<DropdownMenuLabel>Assign to:</DropdownMenuLabel>
			<DropdownMenuSeparator />

			<DropdownMenuCheckboxItem
				checked={!assignee}
				onCheckedChange={() => assignUser(null)}
			>
				<span class="text-sm">Unassigned</span>
			</DropdownMenuCheckboxItem>

			{#each members as member (member.id)}
				<DropdownMenuCheckboxItem
					checked={assignee?.id === member.user.id}
					onCheckedChange={() => assignUser(member.user.id)}
				>
					<div class="flex items-center gap-2">
						{#if member.user.image}
							<img
								src={member.user.image}
								alt={member.user.name || member.user.username}
								class="h-5 w-5 rounded-full"
							/>
						{:else}
							<div class="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
								<span class="text-xs text-muted-foreground">
									{(member.user.name || member.user.username)?.[0]?.toUpperCase()}
								</span>
							</div>
						{/if}
						<span class="text-sm">
							{member.user.name || member.user.username}
						</span>
					</div>
				</DropdownMenuCheckboxItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>

	{#if assignee}
		<Badge variant="secondary" class="gap-1">
			{#if assignee.image}
				<img src={assignee.image} alt={assignee.name} class="h-4 w-4 rounded-full" />
			{:else}
				<div class="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-xs">
					{assignee.name?.[0]?.toUpperCase() || assignee.username?.[0]?.toUpperCase()}
				</div>
			{/if}
			<span class="text-xs">{assignee.name || assignee.username}</span>
		</Badge>
	{/if}
</div>
