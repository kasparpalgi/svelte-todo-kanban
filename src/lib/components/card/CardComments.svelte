<!-- @file src/lib/components/card/CardComments.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { commentsStore } from '$lib/stores/comments.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { formatDate } from '$lib/utils/cardHelpers';
	import { linkifyText } from '$lib/utils/linkifyText';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { MessageSquare, Send, Trash2 } from 'lucide-svelte';
	import type { CardCommentsProps } from '$lib/types/comments';

	let { todo, lang }: CardCommentsProps = $props();

	let newComment = $state('');

	async function addComment() {
		if (!newComment.trim()) return;

		const result = await commentsStore.addComment(todo.id, newComment, todo);
		if (result.success) {
			newComment = '';
			displayMessage($t('card.comment_added'), 1500, true);
		} else {
			displayMessage(result.message || $t('card.add_comment_failed'));
		}
	}

	async function deleteComment(commentId: string) {
		if (!confirm($t('card.delete_comment_confirm'))) return;

		const result = await commentsStore.deleteComment(commentId);
		if (!result.success) {
			displayMessage(result.message || $t('card.delete_comment_failed'));
		}
	}

	function handleCommentKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			addComment();
		}
	}
</script>

<div>
	<Label class="mb-2 flex items-center gap-2">
		<MessageSquare class="h-4 w-4" />
		{$t('card.comments')} ({commentsStore.comments.length})
	</Label>

	<div class="space-y-3">
		{#if commentsStore.loading}
			<div class="py-4 text-center text-sm text-muted-foreground">
				{$t('card.loading_comments')}
			</div>
		{:else if commentsStore.comments.length === 0}
			<p class="py-4 text-center text-sm text-muted-foreground">
				{$t('card.no_comments')}
			</p>
		{:else}
			{#each commentsStore.comments as comment}
				<Card class="p-3">
					<div class="mb-1 flex items-center justify-between">
						<div class="flex items-center gap-2">
							{#if comment.user?.image}
								<img
									src={comment.user.image}
									alt={comment.user.name || comment.user.username}
									class="h-6 w-6 rounded-full"
								/>
							{/if}
							<span class="text-sm font-medium">
								{comment.user?.name || comment.user?.username || $t('card.unknown_user')}
							</span>
							<span class="text-xs text-muted-foreground">
								{formatDate(comment.created_at || '', lang)}
							</span>
						</div>
						<Button
							variant="ghost"
							size="sm"
							class="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
							onclick={() => deleteComment(comment.id)}
						>
							<Trash2 class="h-3 w-3" />
						</Button>
					</div>
					<p class="text-sm whitespace-pre-wrap">
						{@html linkifyText(comment.content)}
					</p>
				</Card>
			{/each}
		{/if}

		<div class="flex gap-2">
			<Textarea
				bind:value={newComment}
				placeholder={$t('card.add_comment_placeholder')}
				rows={2}
				class="flex-1"
				onkeydown={handleCommentKeydown}
			/>
			<Button
				onclick={addComment}
				disabled={!newComment.trim() || commentsStore.loading}
				class="h-auto"
			>
				<Send class="h-4 w-4" />
			</Button>
		</div>
		<p class="text-xs text-muted-foreground">
			{$t('card.press_ctrl_enter_submit')}
		</p>
	</div>
</div>
