/** @file src/lib/stores/comments.svelte.ts */
import {
	GET_COMMENTS,
	GET_COMMENTS_AGGREGATE,
	CREATE_COMMENT,
	UPDATE_COMMENT,
	DELETE_COMMENT,
	CREATE_NOTIFICATION,
	CREATE_ACTIVITY_LOG
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type {
	GetCommentsQuery,
	GetCommentsAggregateQuery,
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
			const { Order_By } = await import('$lib/graphql/generated/graphql');
			const where = { todo_id: { _eq: todoId } };

			// Fetch total count
			const aggregateData: GetCommentsAggregateQuery = await request(GET_COMMENTS_AGGREGATE, {
				where
			});
			state.totalCount = aggregateData.comments_aggregate?.aggregate?.count || 0;

			// Fetch first page of comments
			const data: GetCommentsQuery = await request(GET_COMMENTS, {
				where,
				order_by: [{ created_at: Order_By.Desc }],
				limit: COMMENTS_PER_PAGE,
				offset: 0
			});

			state.comments = data.comments || [];
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
			const { Order_By } = await import('$lib/graphql/generated/graphql');
			const where = { todo_id: { _eq: todoId } };

			// Fetch next page of comments
			const data: GetCommentsQuery = await request(GET_COMMENTS, {
				where,
				order_by: [{ created_at: Order_By.Desc }],
				limit: COMMENTS_PER_PAGE,
				offset: state.comments.length
			});

			const newComments = data.comments || [];
			state.comments = [...state.comments, ...newComments];
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
				state.comments = [newComment, ...state.comments];
			state.totalCount += 1;

				// Log activity: comment created
				try {
					await request(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: todoId,
							action_type: 'commented',
							new_value: content.trim().substring(0, 200) + (content.trim().length > 200 ? '...' : '')
						}
					});
				} catch (error) {
					// Non-blocking: log error but don't fail comment creation
					console.error('[CommentsStore.addComment] Failed to log activity:', error);
				}

				const currentUser = userStore.user;

				// Create notification for assigned user
				if (currentUser && todo?.assigned_to && todo.assigned_to !== currentUser.id) {
					try {
						await request(CREATE_NOTIFICATION, {
							notification: {
								user_id: todo.assigned_to,
								todo_id: todoId,
								type: 'commented',
								triggered_by_user_id: currentUser.id,
								related_comment_id: newComment.id,
								content: `"${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`
							}
						}) as CreateNotificationMutation;
					} catch (notificationError) {
						// Non-blocking: log error but don't fail comment creation
						console.error('[CommentsStore.addComment] Failed to create notification:', notificationError);
					}
				}

				// Create notifications for all subscribers (excluding the comment author and assigned user)
				if (currentUser && todo?.subscribers) {
					const notifiedUsers = new Set([currentUser.id]);
					if (todo.assigned_to) {
						notifiedUsers.add(todo.assigned_to); // Already notified above
					}

					for (const subscription of todo.subscribers) {
						const subscriberId = (subscription as any).user_id;
						if (!notifiedUsers.has(subscriberId)) {
							notifiedUsers.add(subscriberId);
							try {
								await request(CREATE_NOTIFICATION, {
									notification: {
										user_id: subscriberId,
										todo_id: todoId,
										type: 'commented',
										triggered_by_user_id: currentUser.id,
										related_comment_id: newComment.id,
										content: `"${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`
									}
								}) as CreateNotificationMutation;
							} catch (notificationError) {
								// Non-blocking: log error but don't fail comment creation
								console.error('[CommentsStore.addComment] Failed to create notification for subscriber:', notificationError);
							}
						}
					}
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

				// Log activity: comment edited
				try {
					const oldContent = originalComment.content.substring(0, 200) + (originalComment.content.length > 200 ? '...' : '');
					const newContent = content.trim().substring(0, 200) + (content.trim().length > 200 ? '...' : '');
					await request(CREATE_ACTIVITY_LOG, {
						log: {
							todo_id: updatedComment.todo_id,
							action_type: 'comment_edited',
							old_value: oldContent,
							new_value: newContent
						}
					});
				} catch (error) {
					// Non-blocking: log error but don't fail comment update
					console.error('[CommentsStore.updateComment] Failed to log activity:', error);
				}

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

	async function deleteComment(id: string, todo?: any): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const commentIndex = state.comments.findIndex((c) => c.id === id);
		if (commentIndex === -1) return { success: false, message: 'Comment not found' };

		const originalComments = [...state.comments];
		const comment = state.comments[commentIndex];
		const todoId = comment.todo_id;

		// Log activity BEFORE deletion
		try {
			await request(CREATE_ACTIVITY_LOG, {
				log: {
					todo_id: todoId,
					action_type: 'comment_deleted'
				}
			});
		} catch (error) {
			// Non-blocking: log error but don't fail deletion
			console.error('[CommentsStore.deleteComment] Failed to log activity:', error);
		}

		// Optimistic delete
		state.comments = state.comments.filter((c) => c.id !== id);
		state.totalCount -= 1;

		try {
			const data: DeleteCommentMutation = await request(DELETE_COMMENT, {
				where: { id: { _eq: id } }
			});

			if (data.delete_comments?.affected_rows && data.delete_comments.affected_rows > 0) {
				// Sync deletion to GitHub if comment has a GitHub ID
				const githubCommentId = comment.github_comment_id;
				const boardGithub = todo?.list?.board?.github;

				if (githubCommentId && boardGithub) {
					try {
						const githubData = typeof boardGithub === 'string' ? JSON.parse(boardGithub) : boardGithub;
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
