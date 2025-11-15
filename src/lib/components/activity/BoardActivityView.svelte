<!-- @file src/lib/components/activity/BoardActivityView.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { t } from '$lib/i18n';
	import { activityLogStore } from '$lib/stores/activityLog.svelte';
	import BoardActivityList from './BoardActivityList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw } from 'lucide-svelte';

	let {
		open = $bindable(),
		boardId,
		boardName
	}: { open: boolean; boardId: string; boardName: string } = $props();

	onMount(async () => {
		if (boardId) {
			await activityLogStore.loadBoardActivityLogs(boardId);
		}
	});

	async function handleRefresh() {
		if (boardId) {
			await activityLogStore.loadBoardActivityLogs(boardId);
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-h-[85vh] max-w-3xl">
		<DialogHeader>
			<DialogTitle>{$t('activity.board_activity')}</DialogTitle>
			<DialogDescription>
				{$t('activity.board_activity_description', { boardName })}
			</DialogDescription>
		</DialogHeader>

		<div class="flex items-center justify-between border-b pb-3">
			<p class="text-sm text-muted-foreground">
				{$t('activity.showing_activities', { count: activityLogStore.logs.length })}
			</p>
			<Button variant="ghost" size="sm" onclick={handleRefresh} disabled={activityLogStore.loading}>
				<RefreshCw class="h-4 w-4 {activityLogStore.loading ? 'animate-spin' : ''}" />
			</Button>
		</div>

		<div class="max-h-[60vh] overflow-y-auto pr-2">
			{#if activityLogStore.loading}
				<div class="flex items-center justify-center py-12">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
					></div>
					<span class="ml-3 text-muted-foreground">{$t('activity.loading')}</span>
				</div>
			{:else if activityLogStore.error}
				<div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
					<p>{activityLogStore.error}</p>
				</div>
			{:else}
				<BoardActivityList logs={activityLogStore.logs} onClose={() => (open = false)} />
			{/if}
		</div>
	</DialogContent>
</Dialog>
