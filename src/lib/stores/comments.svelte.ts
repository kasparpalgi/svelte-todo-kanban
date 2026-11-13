/** @file src/lib/stores/comments.svelte.ts */
// The open card's comments, through the data API (#229). The server logs the activity and
// notifies the card's assignees and subscribers; the browser only syncs GitHub.
import { call } from '$lib/api/call';
import { browser } from '$app/environment';
import type { CommentFieldsFragment } from '$lib/graphql/generated/graphql';
import type { StoreResult } from '$lib/types/todo';
import { listsStore } from './listsBoards.svelte';

interface CommentsState {
	comments: CommentFieldsFragment[];
	loading: boolean;
	error: string | null;
	totalCount: number;
	hasMore: boolean;
	currentTodoId: string | null;
}

function createCommentsStore() {
	const COMMENTS_PER_PAGE = 10;

	const state = $state<CommentsState>({
		comments: [],
		loading: false,
		error: null,
		totalCount: 0,
		hasMore: false,
		currentTodoId: null
	});

	/** Write a comment back by id: an await may have reordered the list. */
	function replaceComment(id: string, comment: CommentFieldsFragment) {
		const index = state.comments.findIndex((c) => c.id === id);
		if (index !== -1) state.comments[index] = comment;
	}

	async function loadComments(todoId: string): Promise<CommentFieldsFragment[]> {
		if (!browser) return [];

		// Reset if loading a different todo
		if (state.currentTodoId !== todoId) {
			state.comments = [];
			state.totalCount = 0;
			state.hasMore = false;
			state.currentTodoId = todoId;
		}

		state.loading = true;
		state.error = null;

		try {
			const page = await call('getComments', { todoId, limit: COMMENTS_PER_PAGE });
			state.totalCount = page.total;
			state.comments = page.comments;
			state.hasMore = state.comments.length < state.totalCount;
			return state.comments;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading comments';
			state.error = message;
			console.error('Load comments error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function loadMore(todoId: string): Promise<void> {
		if (!browser || state.loading || !state.hasMore) return;

		state.loading = true;
		state.error = null;

		try {
			const page = await call('getComments', {
				todoId,
				limit: COMMENTS_PER_PAGE,
				offset: state.comments.length
			});
			state.totalCount = page.total;
			state.comments = [...state.comments, ...page.comments];
			state.hasMore = state.comments.length < state.totalCount;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading more comments';
			state.error = message;
			console.error('Load more comments error:', error);
		} finally {
			state.loading = false;
		}
	}

	async function addComment(todoId: string, content: string, todo?: any): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!content.trim()) return { success: false, message: 'Comment content is required' };

		try {
			const newComment = await call('createComment', { todoId, content: content.trim() });
			if (newComment) {
				state.comments = [newComment, ...state.comments];
				state.totalCount += 1;

				// Sync to GitHub if todo has a GitHub issue
				const githubIssueNumber = todo?.github_issue_number;
				const githubIssueId = todo?.github_issue_id;
				const boardGithub = listsStore.boardById(todo?.list?.board?.id)?.github;

				if (githubIssueNumber && githubIssueId && boardGithub) {
					try {
						const githubData =
							typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
						const { owner, repo } = githubData as { owner: string; repo: string };

						fetch('/api/github/create-comment', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								commentId: newComment.id,
								todoId,
								githubIssueNumber,
								owner,
								repo,
								body: content.trim()
							})
						}).catch((err) => {
							// Non-blocking: log error but don't fail comment creation
							console.error('Failed to sync comment to GitHub:', err);
						});
					} catch (githubError) {
						// Non-blocking: log error but don't fail comment creation
						console.error('Failed to sync comment to GitHub:', githubError);
					}
				}

				return {
					success: true,
					message: 'Comment added successfully',
					data: newComment
				};
			}

			return { success: false, message: 'Failed to add comment' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error adding comment';
			console.error('Add comment error:', error);
			return { success: false, message };
		}
	}

	async function updateComment(id: string, content: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!content.trim()) return { success: false, message: 'Comment content is required' };

		const commentIndex = state.comments.findIndex((c) => c.id === id);
		if (commentIndex === -1) return { success: false, message: 'Comment not found' };

		const originalComment = { ...state.comments[commentIndex] };

		// Optimistic update
		state.comments[commentIndex] = {
			...state.comments[commentIndex],
			content: content.trim()
		};

		try {
			const updatedComment = await call('updateComment', { id, content: content.trim() });
			if (updatedComment) {
				replaceComment(id, updatedComment);
				return {
					success: true,
					message: 'Comment updated successfully',
					data: updatedComment
				};
			}
			replaceComment(id, originalComment);
			return { success: false, message: 'Failed to update comment' };
		} catch (error) {
			replaceComment(id, originalComment);
			const message = error instanceof Error ? error.message : 'Error updating comment';
			console.error('Update comment error:', error);
			return { success: false, message };
		}
	}

	async function deleteComment(id: string, todo?: any): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const commentIndex = state.comments.findIndex((c) => c.id === id);
		if (commentIndex === -1) return { success: false, message: 'Comment not found' };

		const originalComments = [...state.comments];
		const comment = state.comments[commentIndex];

		// Optimistic delete
		state.comments = state.comments.filter((c) => c.id !== id);
		state.totalCount -= 1;

		try {
			const { deleted } = await call('deleteComment', { id });

			if (deleted) {
				// Sync deletion to GitHub if comment has a GitHub ID
				const githubCommentId = comment.github_comment_id;
				const boardGithub = listsStore.boardById(todo?.list?.board?.id)?.github;

				if (githubCommentId && boardGithub) {
					try {
						const githubData =
							typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
						const { owner, repo } = githubData as { owner: string; repo: string };

						fetch('/api/github/delete-comment', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								commentId: id,
								githubCommentId,
								owner,
								repo
							})
						}).catch((err) => {
							// Non-blocking: log error but don't fail comment deletion
							console.error('Failed to sync comment deletion to GitHub:', err);
						});
					} catch (githubError) {
						// Non-blocking: log error but don't fail comment deletion
						console.error('Failed to sync comment deletion to GitHub:', githubError);
					}
				}

				return { success: true, message: 'Comment deleted successfully' };
			}

			state.comments = originalComments;
			state.totalCount += 1;
			return { success: false, message: 'Failed to delete comment' };
		} catch (error) {
			state.comments = originalComments;
			state.totalCount += 1;
			const message = error instanceof Error ? error.message : 'Error deleting comment';
			console.error('Delete comment error:', error);
			return { success: false, message };
		}
	}

	return {
		get comments() {
			return state.comments;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get totalCount() {
			return state.totalCount;
		},
		get hasMore() {
			return state.hasMore;
		},

		loadComments,
		loadMore,
		addComment,
		updateComment,
		deleteComment,
		clearError: () => {
			state.error = null;
		},
		reset: () => {
			state.comments = [];
			state.loading = false;
			state.error = null;
			state.totalCount = 0;
			state.hasMore = false;
			state.currentTodoId = null;
		}
	};
}

export const commentsStore = createCommentsStore();
