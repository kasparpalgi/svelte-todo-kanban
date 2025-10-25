/** @file src/lib/stores/comments.svelte.ts */
import {
	GET_COMMENTS,
	CREATE_COMMENT,
	UPDATE_COMMENT,
	DELETE_COMMENT,
	CREATE_NOTIFICATION
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	GetCommentsQuery,
	CreateCommentMutation,
	UpdateCommentMutation,
	DeleteCommentMutation,
	CreateNotificationMutation,
	CommentFieldsFragment
} from '$lib/graphql/generated/graphql';
import type { StoreResult } from '$lib/types/todo';
import { userStore } from './user.svelte';

interface CommentsState {
	comments: CommentFieldsFragment[];
	loading: boolean;
	error: string | null;
}

function createCommentsStore() {
	const state = $state<CommentsState>({
		comments: [],
		loading: false,
		error: null
	});

	async function loadComments(todoId: string): Promise<CommentFieldsFragment[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const { Order_By } = await import('$lib/graphql/generated/graphql');

			const data: GetCommentsQuery = await request(GET_COMMENTS, {
				where: { todo_id: { _eq: todoId } },
				order_by: [{ created_at: Order_By.Asc }],
				limit: 1000,
				offset: 0
			});

			state.comments = data.comments || [];
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

	async function addComment(todoId: string, content: string, todo?: any): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		if (!content.trim()) return { success: false, message: 'Comment content is required' };

		try {
			const data: CreateCommentMutation = await request(CREATE_COMMENT, {
				objects: [
					{
						todo_id: todoId,
						content: content.trim()
					}
				]
			});

			const newComment = data.insert_comments?.returning?.[0];
			if (newComment) {
				state.comments = [...state.comments, newComment];

				// Create notification for assigned user and log activity
				const currentUser = userStore.user;
				console.log('[CommentsStore.addComment] Current user:', { id: currentUser?.id, name: currentUser?.name });
				console.log('[CommentsStore.addComment] Todo assigned_to:', todo?.assigned_to);
				console.log('[CommentsStore.addComment] Condition check:', {
					hasCurrentUser: !!currentUser,
					hasAssignedTo: !!todo?.assigned_to,
					isDifferentUser: todo?.assigned_to !== currentUser?.id
				});

				if (currentUser && todo?.assigned_to && todo.assigned_to !== currentUser.id) {
					try {
						console.log('[CommentsStore.addComment] Creating notification with:', {
							user_id: todo.assigned_to,
							todo_id: todoId,
							triggered_by_user_id: currentUser.id,
							related_comment_id: newComment.id
						});

						await request(CREATE_NOTIFICATION, {
							notification: {
								user_id: todo.assigned_to,
								todo_id: todoId,
								type: 'commented',
								triggered_by_user_id: currentUser.id,
								related_comment_id: newComment.id,
								content: `${currentUser.name || 'Someone'} commented: "${content.trim().substring(0, 50)}..."`
							}
						}) as CreateNotificationMutation;
						console.log('[CommentsStore.addComment] Notification created for assigned user');
					} catch (notificationError) {
						// Non-blocking: log error but don't fail comment creation
						console.error('[CommentsStore.addComment] Failed to create notification:', notificationError);
					}
				} else {
					console.log('[CommentsStore.addComment] Notification skipped - condition not met');
				}

				// Sync to GitHub if todo has a GitHub issue
				const githubIssueNumber = todo?.github_issue_number;
				const githubIssueId = todo?.github_issue_id;
				const boardGithub = todo?.list?.board?.github;

				if (githubIssueNumber && githubIssueId && boardGithub) {
					try {
						const githubData = typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
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
			const data: UpdateCommentMutation = await request(UPDATE_COMMENT, {
				where: { id: { _eq: id } },
				_set: { content: content.trim() }
			});

			const updatedComment = data.update_comments?.returning?.[0];
			if (updatedComment) {
				state.comments[commentIndex] = updatedComment;
				return {
					success: true,
					message: 'Comment updated successfully',
					data: updatedComment
				};
			} else {
				state.comments[commentIndex] = originalComment;
				return { success: false, message: 'Failed to update comment' };
			}
		} catch (error) {
			state.comments[commentIndex] = originalComment;
			const message = error instanceof Error ? error.message : 'Error updating comment';
			console.error('Update comment error:', error);
			return { success: false, message };
		}
	}

	async function deleteComment(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const commentIndex = state.comments.findIndex((c) => c.id === id);
		if (commentIndex === -1) return { success: false, message: 'Comment not found' };

		const originalComments = [...state.comments];

		// Optimistic delete
		state.comments = state.comments.filter((c) => c.id !== id);

		try {
			const data: DeleteCommentMutation = await request(DELETE_COMMENT, {
				where: { id: { _eq: id } }
			});

			if (data.delete_comments?.affected_rows && data.delete_comments.affected_rows > 0) {
				return { success: true, message: 'Comment deleted successfully' };
			}

			state.comments = originalComments;
			return { success: false, message: 'Failed to delete comment' };
		} catch (error) {
			state.comments = originalComments;
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

		loadComments,
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
		}
	};
}

export const commentsStore = createCommentsStore();
