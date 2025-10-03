<!-- @file src/routes/[lang]/[username]/[board]/[card]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import {
		X,
		Calendar,
		Tag,
		MessageSquare,
		Send,
		Trash2,
		ImageIcon,
		AlertCircle
	} from 'lucide-svelte';
	import { z } from 'zod';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let { data } = $props();

	const cardId = $derived(page.params.card);
	const lang = $derived(page.params.lang || 'en');
	const username = $derived(page.params.username);
	const boardAlias = $derived(page.params.board);

	let todo = $state<TodoFieldsFragment | null>(null);
	let loading = $state(true);
	let editData = $state({
		title: '',
		content: '',
		due_on: '',
		priority: 0
	});
	let comments = $state<Array<{ id: string; text: string; created_at: string }>>([]);
	let newComment = $state('');
	let validationErrors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);

	const todoEditSchema = z.object({
		title: z.string().min(1, 'Title is required').max(200).trim(),
		content: z.string().max(5000).optional(),
		due_on: z.string().optional(),
		priority: z.number().min(0).max(5).optional()
	});

	onMount(async () => {
		if (!todosStore.initialized) {
			await todosStore.loadTodos();
		}
		const foundTodo = todosStore.todos.find((t) => t.id === cardId);
		if (foundTodo) {
			todo = foundTodo;
			editData = {
				title: foundTodo.title,
				content: foundTodo.content || '',
				due_on: foundTodo.due_on
					? new Date(foundTodo.due_on).toISOString().split('T')[0]
					: '',
				priority: foundTodo.priority || 0
			};
		}
		loading = false;
	});

	function closeModal() {
		goto(`/${lang}/${username}/${boardAlias}`);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	async function saveTodo() {
		if (isSubmitting || !todo) return;

		try {
			const validatedData = todoEditSchema.parse(editData);
			validationErrors = {};
			isSubmitting = true;

			const result = await todosStore.updateTodo(todo.id, {
				title: validatedData.title,
				content: validatedData.content || null,
				due_on: validatedData.due_on || null,
				priority: validatedData.priority || 0
			});

			if (result.success) {
				displayMessage('Card updated successfully', 1500, true);
				todo = todosStore.todos.find((t) => t.id === cardId) || null;
			} else {
				displayMessage(result.message || 'Failed to update card');
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				validationErrors = {};
				error.issues.forEach((issue) => {
					if (issue.path[0]) {
						validationErrors[issue.path[0] as string] = issue.message;
					}
				});
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteTodo() {
		if (!todo || !confirm('Are you sure you want to delete this card?')) return;

		const result = await todosStore.deleteTodo(todo.id);
		if (result.success) {
			displayMessage('Card deleted', 1500, true);
			closeModal();
		} else {
			displayMessage(result.message || 'Failed to delete card');
		}
	}

	async function addComment() {
		if (!newComment.trim()) return;
		// TODO: implement
		comments = [
			...comments,
			{
				id: crypto.randomUUID(),
				text: newComment,
				created_at: new Date().toISOString()
			}
		];
		newComment = '';
		displayMessage('Comment added', 1500, true);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getPriorityColor(priority: number): string {
		if (priority >= 4) return 'bg-red-500';
		if (priority >= 3) return 'bg-orange-500';
		if (priority >= 2) return 'bg-yellow-500';
		if (priority >= 1) return 'bg-blue-500';
		return 'bg-gray-500';
	}
</script>

<svelte:head>
	<title>{todo?.title || 'Card'} | ToDzz</title>
</svelte:head>

<div
	class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
	onclick={handleBackdropClick}
	role="button"
	tabindex="-1"
>
	<div class="fixed inset-4 z-50 overflow-auto md:inset-8 lg:inset-16">
		<div class="mx-auto max-w-4xl" onclick={(e) => e.stopPropagation()}>
			{#if loading}
				<Card class="p-12 text-center">
					<div class="flex items-center justify-center">
						<div
							class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
						></div>
						<span class="ml-3">Loading card...</span>
					</div>
				</Card>
			{:else if !todo}
				<Card class="p-12 text-center">
					<AlertCircle class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h2 class="mb-2 text-xl font-semibold">Card not found</h2>
					<p class="mb-4 text-muted-foreground">This card doesn't exist or has been deleted.</p>
					<Button onclick={closeModal}>Go back to board</Button>
				</Card>
			{:else}
				<Card class="relative">
					<Button
						variant="ghost"
						size="sm"
						onclick={closeModal}
						class="absolute right-4 top-4 h-8 w-8 p-0"
					>
						<X class="h-4 w-4" />
					</Button>

					<CardHeader class="pb-4">
						<div class="mb-2 flex flex-wrap items-center gap-2">
							{#if todo.list}
								<Badge variant="secondary" class="text-xs">
									{todo.list.name}
								</Badge>
							{/if}
							{#if editData.priority > 0}
								<Badge class="{getPriorityColor(editData.priority)} text-xs text-white">
									Priority {editData.priority}
								</Badge>
							{/if}
							{#if todo.labels && todo.labels.length > 0}
								{#each todo.labels as { label }}
									<Badge
										style="background-color: {label.color}"
										class="text-xs text-white"
									>
										{label.name}
									</Badge>
								{/each}
							{/if}
						</div>

						<div class="space-y-4">
							<div>
								<Label for="title">Title</Label>
								<Input
									id="title"
									bind:value={editData.title}
									class="text-lg font-semibold"
									placeholder="Card title"
								/>
								{#if validationErrors.title}
									<p class="mt-1 text-xs text-red-500">{validationErrors.title}</p>
								{/if}
							</div>
						</div>
					</CardHeader>

					<CardContent class="space-y-6">
						<div>
							<Label for="content" class="mb-2 flex items-center gap-2">
								<span>Description</span>
							</Label>
							<Textarea
								id="content"
								bind:value={editData.content}
								placeholder="Add a more detailed description..."
								rows={6}
								class="min-h-[150px] resize-y"
							/>
							<p class="mt-1 text-xs text-muted-foreground">
								Markdown supported. You can use **bold**, *italic*, lists, and more.
							</p>
							{#if validationErrors.content}
								<p class="mt-1 text-xs text-red-500">{validationErrors.content}</p>
							{/if}
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<Label for="due_on" class="mb-2 flex items-center gap-2">
									<Calendar class="h-4 w-4" />
									Due Date
								</Label>
								<Input
									id="due_on"
									type="date"
									bind:value={editData.due_on}
								/>
							</div>

							<div>
								<Label for="priority" class="mb-2 flex items-center gap-2">
									<Tag class="h-4 w-4" />
									Priority
								</Label>
								<Input
									id="priority"
									type="number"
									min="0"
									max="5"
									bind:value={editData.priority}
								/>
							</div>
						</div>

						{#if todo.uploads && todo.uploads.length > 0}
							<div>
								<Label class="mb-2 flex items-center gap-2">
									<ImageIcon class="h-4 w-4" />
									Attachments
								</Label>
								<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
									{#each todo.uploads as upload}
										<img
											src={upload.url}
											alt="Attachment"
											class="h-24 w-full rounded border object-cover"
										/>
									{/each}
								</div>
							</div>
						{/if}

						<div>
							<Label class="mb-2 flex items-center gap-2">
								<MessageSquare class="h-4 w-4" />
								Comments ({comments.length})
							</Label>

							<div class="space-y-3">
								{#each comments as comment}
									<Card class="p-3">
										<p class="text-sm">{comment.text}</p>
										<p class="mt-1 text-xs text-muted-foreground">
											{formatDate(comment.created_at)}
										</p>
									</Card>
								{/each}

								<div class="flex gap-2">
									<Textarea
										bind:value={newComment}
										placeholder="Add a comment..."
										rows={2}
										class="flex-1"
										onkeydown={(e) => {
											if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
												e.preventDefault();
												addComment();
											}
										}}
									/>
									<Button onclick={addComment} disabled={!newComment.trim()} class="h-auto">
										<Send class="h-4 w-4" />
									</Button>
								</div>
								<p class="text-xs text-muted-foreground">Press Ctrl+Enter to submit</p>
							</div>
						</div>

						<div class="flex justify-between border-t pt-4">
							<Button variant="destructive" onclick={deleteTodo}>
								<Trash2 class="mr-2 h-4 w-4" />
								Delete Card
							</Button>
							<div class="flex gap-2">
								<Button variant="outline" onclick={closeModal}>Cancel</Button>
								<Button onclick={saveTodo} disabled={isSubmitting}>
									{isSubmitting ? 'Saving...' : 'Save Changes'}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
</div>