<!-- @file src/lib/components/listBoard/BoardVisibilitySettings.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
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
	import type { BoardFieldsFragment } from '$lib/graphql/generated/graphql';

	interface Props {
		board: BoardFieldsFragment;
		open: boolean;
		onClose: () => void;
	}

	let { board, open = $bindable(), onClose }: Props = $props();

	let isPublic = $state(board.is_public || false);
	let allowPublicComments = $state(board.allow_public_comments || false);
	let copied = $state(false);

	$effect(() => {
		if (open) {
			isPublic = board.is_public || false;
			allowPublicComments = board.allow_public_comments || false;
		}
	});

	// Generate public URL
	const publicUrl = $derived(() => {
		if (!board.user?.username || !board.alias) return '';
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		return `${origin}/${board.user.username}/${board.alias}`;
	});

	async function handleSave() {
		const result = await listsStore.updateBoardVisibility(
			board.id,
			isPublic,
			allowPublicComments
		);

		if (result.success) {
			displayMessage('Visibility settings updated', 1500, true);
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
			displayMessage('URL copied to clipboard', 1500, true);
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			displayMessage('Failed to copy URL');
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Globe class="h-5 w-5" />
				Sharing & Visibility
			</DialogTitle>
			<DialogDescription>
				Control who can view and interact with "{board.name}"
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6">
			<!-- Public Access Toggle -->
			<Card>
				<CardHeader>
					<CardTitle class="text-sm">Public Access</CardTitle>
					<CardDescription class="text-xs">
						Allow anyone with the link to view this board
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center justify-between">
						<Label for="public-toggle" class="cursor-pointer">Make board public</Label>
						<Switch id="public-toggle" bind:checked={isPublic} />
					</div>

					{#if isPublic}
						<Alert>
							<Globe class="h-4 w-4" />
							<AlertDescription>
								Anyone with the link can view this board, but only members can edit it.
							</AlertDescription>
						</Alert>

						<!-- Public URL -->
						<div class="space-y-2">
							<Label class="text-xs text-muted-foreground">Public URL</Label>
							<div class="flex gap-2">
								<input
									type="text"
									readonly
									value={publicUrl()}
									class="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
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

						<!-- Public Comments Toggle -->
						<div class="flex items-center justify-between pt-2 border-t">
							<div class="flex-1">
								<Label for="comments-toggle" class="cursor-pointer flex items-center gap-2">
									<MessageSquare class="h-4 w-4" />
									Allow public comments
								</Label>
								<p class="text-xs text-muted-foreground mt-1">
									Let non-members comment on tasks
								</p>
							</div>
							<Switch id="comments-toggle" bind:checked={allowPublicComments} />
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Privacy Notice -->
			{#if !isPublic}
				<Alert>
					<AlertDescription>
						This board is private. Only board members can view and edit it.
					</AlertDescription>
				</Alert>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={onClose}>Cancel</Button>
			<Button onclick={handleSave}>Save Changes</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
