<!-- @file src/routes/[lang]/[username]/[board]/[card]/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { commentsStore } from '$lib/stores/comments.svelte';
	import { t, locale } from '$lib/i18n';
	import { z } from 'zod';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import {
		todoEditSchema,
		getPriorityColor,
		getPriorityLabel,
		calculateAverageHours
	} from '$lib/utils/cardHelpers';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { X, Calendar, Tag, CircleAlert, Clock } from 'lucide-svelte';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import CardLabelManager from '$lib/components/todo/CardLabelManager.svelte';
	import CardImageManager from '$lib/components/card/CardImageManager.svelte';
	import CardComments from '$lib/components/card/CardComments.svelte';
	import CardLoading from '$lib/components/card/CardLoading.svelte';
	import type { Readable } from 'svelte/store';
	import type { Editor } from 'svelte-tiptap';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

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
	let validationErrors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let editor: Readable<Editor> | null = $state(null);
	let imageManager = $state<CardImageManager>();

	$effect(() => {
		locale.set(lang);
	});

	$effect(() => {
		const foundTodo = todosStore.todos.find((t) => t.id === cardId);
		if (foundTodo && todo) {
			todo = foundTodo;
		}
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
		}
		loading = false;
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

			const newImages = imageManager?.getNewImages() || [];
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
			onkeydown={(e) => {
				if (e.key !== 'Escape' && !(e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
					e.stopPropagation();
				}
			}}
			role="dialog"
			tabindex="-1"
		>
			{#if loading}
				<CardLoading />
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
									{getPriorityLabel(editData.priority, $t)}
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
											~{calculateAverageHours(editData.min_hours, editData.max_hours)}h
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

						<CardImageManager
							bind:this={imageManager}
							todoId={todo.id}
							initialImages={todo.uploads?.map((upload) => ({
								id: upload.id,
								file: null,
								preview: upload.url,
								isExisting: true
							})) || []}
						/>

						<CardComments {todo} {lang} />

						<div class="flex justify-between border-t pt-4">
							<Button variant="destructive" onclick={deleteTodo}>
								<X class="mr-2 h-4 w-4" />
								{$t('card.delete_card')}
							</Button>

							<div class="flex gap-2">
								<Button variant="outline" onclick={closeModal}>
									{$t('common.close')}
								</Button>
								<Button onclick={saveTodo} disabled={isSubmitting} size="sm">
									{isSubmitting ? $t('common.saving') : $t('common.save')}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
</div>

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
