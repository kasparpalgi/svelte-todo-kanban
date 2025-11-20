<!-- @file src/lib/components/todo/CardSubscribers.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { boardMembersStore } from '$lib/stores/boardMembers.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuCheckboxItem
	} from '$lib/components/ui/dropdown-menu';
	import { Bell } from 'lucide-svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let { todo }: { todo: TodoFieldsFragment } = $props();
	let isOpen = $state(false);

	const user = $derived(userStore.user);
	const members = $derived(boardMembersStore.members);
	const subscribers = $derived(todo.subscribers || []);
	const subscriberIds = $derived(new Set(subscribers.map((s: any) => s.user_id)));
	const subscriberCount = $derived(subscribers.length);

	// Filter out the assigned user from available members (they're already notified as assignee)
	const availableMembers = $derived(
		members.filter(member => member.user.id !== todo.assigned_to)
	);

	onMount(async () => {
		if (todo.list?.board?.id) {
			await boardMembersStore.loadMembers(todo.list.board.id);
		}
	});

	async function toggleSubscription(userId: string) {
		if (!todo.id) return;

		const isSubscribed = subscriberIds.has(userId);

		const result = isSubscribed
			? await todosStore.unsubscribeFromTodo(todo.id, userId)
			: await todosStore.subscribeToTodo(todo.id, userId);

		if (result.success) {
			displayMessage(
				isSubscribed ? $t('todo.unsubscribed_success') : $t('todo.subscribed_success'),
				1500,
				true
			);
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
				class="gap-2 h-8 px-2"
				title={$t('todo.manage_subscribers')}
			>
				<Bell class="h-4 w-4" />
				{#if subscriberCount > 0}
					<span class="text-xs">{subscriberCount}</span>
				{:else}
					<span class="text-xs text-muted-foreground">0</span>
				{/if}
			</Button>
		</DropdownMenuTrigger>

		<DropdownMenuContent align="start" class="w-64">
			<DropdownMenuLabel>{$t('todo.subscribers')}</DropdownMenuLabel>
			<DropdownMenuSeparator />

			<div class="max-h-64 overflow-y-auto">
				{#if availableMembers.length === 0}
					<div class="px-2 py-3 text-sm text-muted-foreground">
						{$t('todo.no_members_to_subscribe')}
					</div>
				{:else}
					{#each availableMembers as member (member.id)}
						{@const isSubscribed = subscriberIds.has(member.user.id)}
						<DropdownMenuCheckboxItem
							checked={isSubscribed}
							onCheckedChange={() => toggleSubscription(member.user.id)}
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
									{#if member.user.id === user?.id}
										<span class="text-xs text-muted-foreground">({$t('todo.you')})</span>
									{/if}
								</span>
							</div>
						</DropdownMenuCheckboxItem>
					{/each}
				{/if}
			</div>

			{#if subscriberCount > 0}
				<DropdownMenuSeparator />
				<div class="px-2 py-2 text-xs text-muted-foreground">
					{$t('todo.subscribers_count', { count: subscriberCount })}
				</div>
			{/if}
		</DropdownMenuContent>
	</DropdownMenu>
</div>
