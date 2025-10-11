<!-- @file src/routes/[lang]/[username]/[board]/[card]/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { scale } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { commentsStore } from '$lib/stores/comments.svelte';
	import { t, locale } from '$lib/i18n';
	import { z } from 'zod';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import {
		X,
		Calendar,
		Tag,
		MessageSquare,
		Send,
		Trash2,
		ImageIcon,
		CircleAlert,
		Upload,
		Clock
	} from 'lucide-svelte';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import CardLabelManager from '$lib/components/todo/CardLabelManager.svelte';
	import type { Readable } from 'svelte/store';
	import type { Editor } from 'svelte-tiptap';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import type { TodoImage } from '$lib/types/imageUpload';

	const cardId = $derived(page.params.card);
	const lang = $derived(page.params.lang || 'et');
	const username = $derived(page.params.username);
	const boardAlias = $derived(page.params.board);

	let todo = $state<TodoFieldsFragment | null>(null);
	let loading = $state(true);
	let editData = $state({
		title: '',
		due_on: '',
		priority: 'low' as 'low' | 'medium' | 'high',
		min_hours: null as number | null,
		max_hours: null as number | null,
		actual_hours: null as number | null,
		comment_hours: ''
	});
	let newComment = $state('');
	let validationErrors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let editor: Readable<Editor> | null = $state(null);
	let images = $state<TodoImage[]>([]);
	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let showUploadArea = $state(false);
	let selectedImage = $state<TodoImage | null>(null);

	$effect(() => {
		locale.set(lang);
	});

	$effect(() => {
		const foundTodo = todosStore.todos.find((t) => t.id === cardId);
		if (foundTodo && todo) {
			todo = foundTodo;
		}
	});

	const todoEditSchema = z.object({
		title: z.string().min(1, 'Title is required').max(200).trim(),
		content: z.string().max(10000).optional(),
		due_on: z.string().optional(),
		priority: z.enum(['low', 'medium', 'high']).optional(),
		min_hours: z.number().positive().nullable().optional(),
		max_hours: z.number().positive().nullable().optional(),
		actual_hours: z.number().positive().nullable().optional(),
		comment_hours: z.string().max(10000).optional()
	});

	onMount(async () => {
		const foundTodo = todosStore.todos.find((t) => t.id === cardId);
		if (foundTodo) {
			todo = foundTodo;
			editData = {
				title: foundTodo.title,
				due_on: foundTodo.due_on ? new Date(foundTodo.due_on).toISOString().split('T')[0] : '',
				priority: (foundTodo.priority as 'low' | 'medium' | 'high') || 'low',
				min_hours: foundTodo.min_hours ?? null,
				max_hours: foundTodo.max_hours ?? null,
				actual_hours: foundTodo.actual_hours ?? null,
				comment_hours: foundTodo.comment_hours || ''
			};

			await commentsStore.loadComments(cardId || '');

			images =
				foundTodo.uploads?.map((upload) => ({
					id: upload.id,
					file: null,
					preview: upload.url,
					isExisting: true
				})) || [];
		}
		loading = false;
	});

	onDestroy(() => {
		images.forEach((img) => {
			if (!img.isExisting && img.preview.startsWith('blob:')) {
				URL.revokeObjectURL(img.preview);
			}
		});
	});

	function closeModal() {
		commentsStore.reset();
		goto(`/${lang}/${username}/${boardAlias}`);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		} else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			saveTodo();
		}
	}

	async function saveTodo() {
		if (isSubmitting || !todo || !editor) return;

		try {
			const content = get(editor).getHTML();

			const validatedData = todoEditSchema.parse({
				...editData,
				content
			});

			validationErrors = {};
			isSubmitting = true;

			const result = await todosStore.updateTodo(todo.id, {
				title: validatedData.title,
				content: validatedData.content || null,
				due_on: validatedData.due_on || null,
				priority: validatedData.priority || 'low',
				min_hours: validatedData.min_hours,
				max_hours: validatedData.max_hours,
				actual_hours: validatedData.actual_hours,
				comment_hours: validatedData.comment_hours
			});

			if (!result.success) {
				displayMessage(result.message || $t('card.update_failed'));
				return;
			}

			const newImages = images.filter((img) => !img.isExisting && img.file);
			if (newImages.length > 0 && todo) {
				try {
					const uploadPromises = newImages.map(async (img) => {
						const formData = new FormData();
						formData.append('file', img.file!);
						const response = await fetch('/api/upload', {
							method: 'POST',
							body: formData
						});
						const uploadResult = await response.json();
						if (uploadResult.success && todo) {
							return await todosStore.createUpload(todo.id, uploadResult.url);
						} else {
							throw new Error(uploadResult.error || 'Upload failed');
						}
					});
					await Promise.all(uploadPromises);
					displayMessage($t('card.card_and_images_updated'), 2000, true);
				} catch (error) {
					displayMessage($t('card.card_saved_upload_failed'));
					console.error('Upload error:', error);
				}
			} else {
				displayMessage($t('card.card_updated'), 1500, true);
			}

			todo = todosStore.todos.find((t) => t.id === cardId) || null;
			setTimeout(() => closeModal(), 300);
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
		if (!todo || !confirm($t('card.delete_card_confirm'))) return;

		const result = await todosStore.deleteTodo(todo.id);
		if (result.success) {
			displayMessage($t('card.card_deleted'), 1500, true);
			closeModal();
		} else {
			displayMessage(result.message || $t('card.delete_failed'));
		}
	}

	async function addComment() {
		if (!newComment.trim() || !todo) return;

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

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'high':
				return 'bg-red-500';
			case 'medium':
				return 'bg-orange-500';
			case 'low':
				return 'bg-blue-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getPriorityLabel(priority: 'low' | 'medium' | 'high'): string {
		const key = `card.priority_${priority}` as const;
		return $t(key);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		const files = Array.from(event.dataTransfer?.files || []);
		addFiles(files);
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		addFiles(files);
		target.value = '';
	}

	function addFiles(files: File[]) {
		const imageFiles = files.filter(
			(file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
		);

		imageFiles.forEach((file) => {
			const id = crypto.randomUUID();
			const preview = URL.createObjectURL(file);
			images = [...images, { id, file, preview, isExisting: false }];
		});

		const invalidFiles = files.filter(
			(file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
		);
		if (invalidFiles.length > 0) {
			displayMessage($t('card.some_files_rejected'));
		}

		if (imageFiles.length > 0) {
			showUploadArea = true;
		}
	}

	function removeImage(imageId: string) {
		const image = images.find((img) => img.id === imageId);
		if (image) {
			if (image.isExisting && todo) {
				todosStore.deleteUpload(imageId, todo.id);
			} else {
				if (image.preview.startsWith('blob:')) {
					URL.revokeObjectURL(image.preview);
				}
			}
			images = images.filter((img) => img.id !== imageId);
		}
	}
</script>

<svelte:head>
	<title>{todo?.title || $t('card.title')} | ToDzz</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
	onclick={handleBackdropClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			closeModal();
		}
	}}
	role="button"
	tabindex="-1"
>
	<div class="fixed inset-4 z-50 overflow-auto md:inset-8 lg:inset-16">
		<div
			class="mx-auto max-w-4xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			{#if loading}
				<Card class="p-12 text-center">
					<div class="flex items-center justify-center">
						<div
							class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
						></div>
						<span class="ml-3">{$t('card.loading_card')}</span>
					</div>
				</Card>
			{:else if !todo}
				<Card class="p-12 text-center">
					<CircleAlert class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h2 class="mb-2 text-xl font-semibold">{$t('card.card_not_found')}</h2>
					<p class="mb-4 text-muted-foreground">{$t('card.card_not_found_description')}</p>
					<Button onclick={closeModal}>{$t('card.go_back_to_board')}</Button>
				</Card>
			{:else}
				<Card class="relative">
					<Button
						variant="ghost"
						size="sm"
						onclick={closeModal}
						class="absolute top-2 right-2 z-10 h-7 w-7 p-0"
					>
						<X class="h-3.5 w-3.5" />
					</Button>

					<CardHeader class="pr-12 pb-4">
						<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
							<div class="flex flex-1 flex-wrap items-center gap-2">
								{#if todo.list}
									<Badge variant="secondary" class="text-xs">
										{todo.list.name}
									</Badge>
								{/if}
								<Badge class="{getPriorityColor(editData.priority)} text-xs text-white">
									{getPriorityLabel(editData.priority)}
								</Badge>
							</div>

							<Button onclick={saveTodo} disabled={isSubmitting} size="sm" class="shrink-0">
								{isSubmitting ? $t('common.saving') : $t('common.save')}
							</Button>
						</div>

						<div class="space-y-4">
							<div>
								<Label for="title">{$t('card.title_label')}</Label>
								<Input
									id="title"
									bind:value={editData.title}
									class="text-lg font-semibold"
									placeholder={$t('card.title_placeholder')}
								/>
								{#if validationErrors.title}
									<p class="mt-1 text-xs text-red-500">{validationErrors.title}</p>
								{/if}
							</div>
						</div>
					</CardHeader>

					<CardContent class="space-y-6">
						<div>
							<Label class="mb-2">{$t('card.description_label')}</Label>

							<RichTextEditor bind:editor content={todo.content || ''} />

							{#if validationErrors.content}
								<p class="mt-1 text-xs text-red-500">{validationErrors.content}</p>
							{/if}
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<Label for="due_on" class="mb-2 flex items-center gap-2">
									<Calendar class="h-4 w-4" />
									{$t('card.due_date_label')}
								</Label>
								<Input id="due_on" type="date" bind:value={editData.due_on} />
							</div>

							<div>
								<Label for="priority" class="mb-2 flex items-center gap-2">
									<Tag class="h-4 w-4" />
									{$t('card.priority_label')}
								</Label>
								<select
									id="priority"
									bind:value={editData.priority}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									<option value="low">{$t('card.priority_low')}</option>
									<option value="medium">{$t('card.priority_medium')}</option>
									<option value="high">{$t('card.priority_high')}</option>
								</select>
							</div>
						</div>

						{#if todo.list?.board?.settings?.enable_hour_tracking}
							<div>
								<div class="mb-2 flex">
									<Clock class="mt-0.5 mr-2 h-4 w-4" />{$t('card.hour_tracking')}
								</div>
								<div class="grid gap-4 sm:grid-cols-4">
									<div>
										<Label for="min_hours">{$t('card.min_hours')}</Label>
										<Input id="min_hours" type="number" bind:value={editData.min_hours} />
									</div>
									<div>
										<Label for="max_hours">{$t('card.max_hours')}</Label>
										<Input id="max_hours" type="number" bind:value={editData.max_hours} />
									</div>

									<div>
										<Label for="actual_hours">{$t('card.actual_hours')}</Label>
										<Input id="actual_hours" type="number" bind:value={editData.actual_hours} />
									</div>

									{#if editData.min_hours && editData.max_hours}
										<div in:scale class="mt-5 text-2xl">
											~{editData.min_hours && editData.max_hours
												? ((editData.min_hours + editData.max_hours) / 2).toFixed(1)
												: '?'}h
										</div>
									{/if}
								</div>
								<div class="mt-4">
									<Label for="comment_hours">{$t('card.comment_hours')}</Label>
									<Textarea id="comment_hours" bind:value={editData.comment_hours} />
								</div>
							</div>
						{/if}

						<CardLabelManager {todo} />

						<div>
							<Label class="mb-2 flex items-center gap-2">
								<ImageIcon class="h-4 w-4" />
								{$t('card.attachments')} ({images.filter((img) => img.isExisting).length})
							</Label>

							{#if images.filter((img) => img.isExisting).length > 0}
								<div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
									{#each images.filter((img) => img.isExisting) as image}
										<div class="group relative">
											<button
												type="button"
												onclick={() => (selectedImage = image)}
												class="block h-24 w-full overflow-hidden rounded border"
											>
												<img
													src={image.preview}
													alt={$t('common.attachment')}
													class="h-full w-full object-cover transition-transform group-hover:scale-105"
												/>
											</button>
											<Button
												type="button"
												size="sm"
												variant="destructive"
												class="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
												onclick={() => removeImage(image.id)}
											>
												<X class="h-3 w-3" />
											</Button>
										</div>
									{/each}
								</div>
							{/if}

							{#if images.filter((img) => !img.isExisting).length > 0}
								<div class="mb-4">
									<span class="mb-2 block text-sm font-medium">
										{$t('card.new_images_upload')}
									</span>
									<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
										{#each images.filter((img) => !img.isExisting) as image}
											<div class="group relative">
												<div class="h-24 w-full overflow-hidden rounded border">
													<img
														src={image.preview}
														alt={$t('card.new_upload_alt')}
														class="h-full w-full object-cover"
													/>
												</div>
												<Button
													type="button"
													size="sm"
													variant="destructive"
													class="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
													onclick={() => removeImage(image.id)}
												>
													<X class="h-3 w-3" />
												</Button>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if showUploadArea}
								<div>
									<span class="mb-2 block text-sm font-medium text-foreground">
										{$t('card.add_images')}
									</span>
									<div
										tabindex="0"
										aria-label={$t('card.upload_drag_drop_label')}
										role="button"
										class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center transition-colors {isDragOver
											? 'border-primary bg-primary/5'
											: ''}"
										ondragover={handleDragOver}
										ondragleave={handleDragLeave}
										ondrop={handleDrop}
									>
										<Upload class="mx-auto h-6 w-6 text-muted-foreground" />
										<p class="mt-2 text-sm text-muted-foreground">
											{$t('card.drag_drop_prompt')}
											<button
												type="button"
												onclick={() => fileInput?.click()}
												class="text-primary hover:underline focus:underline focus:outline-none"
											>
												{$t('card.click_to_select')}
											</button>
										</p>
										<p class="mt-1 text-xs text-muted-foreground">
											{$t('card.image_size_limit')}
										</p>
										<input
											bind:this={fileInput}
											type="file"
											multiple
											accept="image/*"
											onchange={handleFileSelect}
											class="hidden"
										/>
									</div>
								</div>
							{:else}
								<Button
									type="button"
									variant="link"
									class="flex h-auto justify-start p-0 text-muted-foreground"
									onclick={() => (showUploadArea = true)}
								>
									<ImageIcon class="mr-2 h-4 w-4" />
									{$t('card.attach_images')}
								</Button>
							{/if}
						</div>

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
														{comment.user?.name ||
															comment.user?.username ||
															$t('card.unknown_user')}
													</span>
													<span class="text-xs text-muted-foreground">
														{formatDate(comment.created_at || '')}
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
											<p class="text-sm whitespace-pre-wrap">{comment.content}</p>
										</Card>
									{/each}
								{/if}

								<div class="flex gap-2">
									<Textarea
										bind:value={newComment}
										placeholder={$t('card.add_comment_placeholder')}
										rows={2}
										class="flex-1"
										onkeydown={(e) => {
											if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
												e.preventDefault();
												addComment();
											}
										}}
									/>
									<Button
										onclick={addComment}
										disabled={!newComment.trim() || commentsStore.loading}
										class="h-auto"
									>
										<Send class="h-4 w-4" />
									</Button>
								</div>
								<p class="text-xs text-muted-foreground">{$t('card.press_ctrl_enter_submit')}</p>
							</div>
						</div>

						<div class="flex justify-between border-t pt-4">
							<Button variant="destructive" onclick={deleteTodo}>
								<Trash2 class="mr-2 h-4 w-4" />
								{$t('card.delete_card')}
							</Button>
							<Button variant="outline" onclick={closeModal}>{$t('common.close')}</Button>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
</div>

{#if selectedImage}
	<Dialog open={!!selectedImage} onOpenChange={() => (selectedImage = null)}>
		<DialogContent class="max-w-4xl">
			<img src={selectedImage.preview} alt={$t('common.full_size')} class="w-full rounded" />
		</DialogContent>
	</Dialog>
{/if}

<style>
	:global(.ProseMirror) {
		outline: none;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.ProseMirror h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror ul),
	:global(.ProseMirror ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror code) {
		background-color: rgba(0, 0, 0, 0.05);
		border-radius: 0.25rem;
		padding: 0.125rem 0.25rem;
		font-family: monospace;
		font-size: 0.875em;
	}

	:global(.ProseMirror ul[data-type='taskList']) {
		list-style: none;
		padding-left: 0;
	}

	:global(.ProseMirror ul[data-type='taskList'] li) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	:global(.ProseMirror ul[data-type='taskList'] li > label) {
		flex: 0 0 auto;
		margin-top: 0.125rem;
	}

	:global(.ProseMirror ul[data-type='taskList'] li > div) {
		flex: 1 1 auto;
	}
</style>
