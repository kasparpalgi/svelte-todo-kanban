<!-- @file src/lib/components/listBoard/BoardVisibilitySettings.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Globe, Copy, Check, MessageSquare } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import type { VisibilityProps } from '$lib/types/listBoard';

	let { board, open = $bindable(), onClose }: VisibilityProps = $props();

	let isPublic = $state(board.is_public || false);
	let allowPublicComments = $state(board.allow_public_comments || false);
	let copied = $state(false);

	$effect(() => {
		if (open) {
			isPublic = board.is_public || false;
			allowPublicComments = board.allow_public_comments || false;
		}
	});

	const publicUrl = $derived(() => {
		if (!board.user?.username || !board.alias) return '';
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		return `${origin}/${board.user.username}/${board.alias}`;
	});

	async function handleSave() {
		const result = await listsStore.updateBoardVisibility(board.id, isPublic, allowPublicComments);

		if (result.success) {
			displayMessage($t('visibility.visibility_updated'), 1500, true);
			onClose();
		} else {
			displayMessage(result.message);
		}
	}

	async function copyUrl() {
		const url = publicUrl();
		if (!url) return;

		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			displayMessage($t('visibility.url_copied'), 1500, true);
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			displayMessage($t('visibility.failed_copy_url'));
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Globe class="h-5 w-5" />
				{$t('visibility.sharing_visibility')}
			</DialogTitle>
			<DialogDescription>
				{$t('visibility.control_access')}
				{board.name}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="text-sm">{$t('visibility.public_access')}</CardTitle>
					<CardDescription class="text-xs">
						{$t('visibility.public_access_description')}
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<Label for="public-toggle" class="cursor-pointer">
							{$t('visibility.make_board_public')}
						</Label>
						<Switch id="public-toggle" bind:checked={isPublic} />
					</div>

					{#if isPublic}
						<Alert>
							<Globe class="h-4 w-4" />
							<AlertDescription>
								{$t('visibility.public_notice')}
							</AlertDescription>
						</Alert>

						<div class="space-y-2">
							<Label class="text-xs text-muted-foreground">
								{$t('visibility.public_url_label')}
							</Label>
							<div class="flex gap-2">
								<input
									type="text"
									readonly
									value={publicUrl()}
									class="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
								/>
								<Button variant="outline" size="sm" onclick={copyUrl}>
									{#if copied}
										<Check class="h-4 w-4" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</Button>
							</div>
						</div>

						<div class="flex items-center justify-between border-t pt-2">
							<div class="flex-1">
								<Label for="comments-toggle" class="flex cursor-pointer items-center gap-2">
									<MessageSquare class="h-4 w-4" />
									{$t('visibility.allow_public_comments')}
								</Label>
								<p class="mt-1 text-xs text-muted-foreground">
									{$t('visibility.public_comments_description')}
								</p>
							</div>
							<Switch id="comments-toggle" bind:checked={allowPublicComments} />
						</div>
					{/if}
				</CardContent>
			</Card>

			{#if !isPublic}
				<Alert>
					<AlertDescription>
						{$t('visibility.private_notice')}
					</AlertDescription>
				</Alert>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={onClose}>{$t('common.cancel')}</Button>
			<Button onclick={handleSave}>{$t('visibility.save_changes')}</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
