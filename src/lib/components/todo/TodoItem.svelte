<!-- @file src/lib/components/todo/TodoItem.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { editingTodo } from '$lib/stores/states.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Check,
		SquarePen,
		Calendar,
		Trash2,
		ImageIcon,
		GithubIcon,
		Clock,
		MessageSquareText
	} from 'lucide-svelte';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { z } from 'zod';
	import { t } from '$lib/i18n';
	import { shortenText } from '$lib/utils/shortenText';
	import { stripHtml } from '$lib/utils/stripHtml';
	import TodoEditForm from './TodoEditForm.svelte';
	import DragHandle from './DragHandle.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import type { TodoItemProps } from '$lib/types/todo';
	import type { TodoImage } from '$lib/types/imageUpload';

	let { todo, isDragging = false }: TodoItemProps = $props();

	const lang = $derived(page.params.lang || 'en');
	const username = $derived(page.params.username);
	const boardAlias = $derived(page.params.board);
	let sortable = useSortable({ id: todo.id });
	let { attributes, listeners, setNodeRef, transform, isDragging: sortableIsDragging } = sortable;

	const todoEditSchema = z.object({
		title: z
			.string()
			.min(1, $t('validation.title_required'))
			.max(200, $t('validation.title_max_length'))
			.trim(),
		content: z
			.string()
			.max(1000, $t('validation.content_max_length'))
			.optional()
			.transform((val) => (val === '' ? undefined : val)),
		due_on: z
			.string()
			.optional()
			.transform((val) => (val === '' ? undefined : val))
			.refine(
				(val) => {
					if (!val) return true;
					const date = new Date(val);
					return !isNaN(date.getTime());
				},
				{ message: $t('validation.invalid_date') }
			)
	});

	type TodoEditData = z.infer<typeof todoEditSchema>;

	let isEditing = $derived(editingTodo.id === todo.id);
	let isHovered = $state(false);
	let editData = $state<TodoEditData>({
		title: todo.title,
		content: todo.content || '',
		due_on: todo.due_on ? new Date(todo.due_on).toISOString().split('T')[0] : ''
	});
	let images = $state<TodoImage[]>([]);
	let validationErrors = $state<Record<string, string>>({});
	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let isSubmitting = $state(false);
	let localHasUnsavedChanges = $state(false);
	let style = $derived(transform.current ? CSS.Transform.toString(transform.current) : '');
	let showDeleteConfirm = $state(false);
	let showUnsavedChangesConfirm = $state(false);
	let showStartEditConfirm = $state(false);
	let pendingAction = $state<(() => void) | null>(null);

	$effect(() => {
		if (!isEditing) {
			editData = {
				title: todo.title,
				content: todo.content || '',
				due_on: todo.due_on ? new Date(todo.due_on).toISOString().split('T')[0] : ''
			};
		}
	});

	$effect(() => {
		return () => {
			images.forEach((img) => {
				if (!img.isExisting && img.preview.startsWith('blob:')) {
					URL.revokeObjectURL(img.preview);
				}
			});
		};
	});

	// Track changes (unsaved warning)
	$effect(() => {
		if (isEditing) {
			const originalData = {
				title: todo.title,
				content: todo.content || '',
				due_on: todo.due_on ? new Date(todo.due_on).toISOString().split('T')[0] : ''
			};

			const hasDataChanges =
				editData.title !== originalData.title ||
				editData.content !== originalData.content ||
				editData.due_on !== originalData.due_on;

			const hasNewImages = images.some((img) => !img.isExisting);

			localHasUnsavedChanges = hasDataChanges || hasNewImages;
		} else {
			localHasUnsavedChanges = false;
		}
	});

	$effect(() => {
		if (isEditing) {
			editingTodo.setUnsaved(localHasUnsavedChanges);
		}
	});

	function startEdit() {
		if (editingTodo.id && editingTodo.id !== todo.id && editingTodo.hasUnsavedChanges) {
			pendingAction = () => {
				editingTodo.start(todo.id);
				validationErrors = {};
				images =
					todo.uploads?.map((upload) => ({
						id: upload.id,
						file: null,
						preview: upload.url,
						isExisting: true
					})) || [];
			};
			showStartEditConfirm = true;
			return;
		}

		editingTodo.start(todo.id);
		validationErrors = {};
		images =
			todo.uploads?.map((upload) => ({
				id: upload.id,
				file: null,
				preview: upload.url,
				isExisting: true
			})) || [];
	}

	function cancelEdit() {
		if (localHasUnsavedChanges) {
			pendingAction = () => {
				editingTodo.stop();
				cleanupImages();
				validationErrors = {};
			};
			showUnsavedChangesConfirm = true;
			return;
		}

		editingTodo.stop();
		cleanupImages();
		validationErrors = {};
	}

	function cleanupImages() {
		images.forEach((img) => {
			if (!img.isExisting && img.preview.startsWith('blob:')) {
				URL.revokeObjectURL(img.preview);
			}
		});
		images = [];
	}

	async function saveEdit() {
		if (isSubmitting) return;

		try {
			const validatedData = todoEditSchema.parse(editData);
			validationErrors = {};
			isSubmitting = true;

			const updateData: Partial<Pick<TodoFieldsFragment, 'title' | 'content' | 'due_on'>> = {
				title: validatedData.title,
				content: validatedData.content || null,
				due_on: validatedData.due_on || null
			};

			const result = await todosStore.updateTodo(todo.id, updateData);

			if (!result.success) {
				displayMessage(result.message || $t('todo.update_failed'));
				return;
			}

			const newImages = images.filter((img) => !img.isExisting && img.file);

			editingTodo.stop();
			cleanupImages();

			if (newImages.length > 0) {
				try {
					const uploadPromises = newImages.map(async (img) => {
						const formData = new FormData();
						formData.append('file', img.file!);
						const response = await fetch('/api/upload', {
							method: 'POST',
							body: formData
						});
						const result = await response.json();
						if (result.success) {
							return await todosStore.createUpload(todo.id, result.url);
						} else {
							throw new Error(result.error || 'Upload failed');
						}
					});
					await Promise.all(uploadPromises);
					displayMessage($t('todo.upload_success'), 2000, true);
				} catch (error) {
					displayMessage($t('todo.upload_partial_failure'));
					console.error('Upload error:', error);
				}
			} else {
				displayMessage($t('todo.update_success'), 1500, true);
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				validationErrors = {};
				error.issues.forEach((issue) => {
					if (issue.path[0]) {
						validationErrors[issue.path[0] as string] = issue.message;
					}
				});
			} else {
				displayMessage($t('common.unexpected_error'));
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function toggleComplete() {
		const result = await todosStore.toggleTodo(todo.id);
		if (!result.success) {
			displayMessage(result.message || $t('todo.status_update_failed'));
		}
	}

	async function deleteTodo() {
		const result = await todosStore.deleteTodo(todo.id);
		if (!result.success) {
			displayMessage(result.message || $t('todo.delete_failed'));
		}
	}

	function confirmDeleteTodo() {
		showDeleteConfirm = true;
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
			displayMessage($t('todo.file_upload_validation_error'));
		}
	}

	function removeImage(imageId: string) {
		const image = images.find((img) => img.id === imageId);
		if (image) {
			if (image.isExisting) {
				todosStore.deleteUpload(imageId, todo.id);
			} else {
				if (image.preview.startsWith('blob:')) {
					URL.revokeObjectURL(image.preview);
				}
			}
			images = images.filter((img) => img.id !== imageId);
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return $t('date.today');
		if (diffDays === 1) return $t('date.tomorrow');
		if (diffDays === -1) return $t('date.yesterday');
		if (diffDays > 0) return $t('date.in_days') + diffDays;
		return $t('date.days_ago') + Math.abs(diffDays);
	}

	function isOverdue(dateString: string): boolean {
		return new Date(dateString) < new Date();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancelEdit();
		} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			saveEdit();
		}
	}

	function preventDrag(event: Event) {
		event.stopPropagation();
	}

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}

	function handleConfirmAction() {
		if (pendingAction) {
			pendingAction();
			pendingAction = null;
		}
	}

	function handleCancelAction() {
		pendingAction = null;
	}

	function handleCardClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.closest('button') || target.closest('[role="button"]') || isEditing) {
			event.preventDefault();
			return;
		}
		goto(`/${lang}/${username}/${boardAlias}/${todo.id}`);
	}
</script>

<div
	use:setNodeRef
	{style}
	class="mt-2 touch-none"
	class:opacity-50={sortableIsDragging.current || isDragging}
>
	{#if !isEditing}
		<a
			href="/{lang}/{username}/{boardAlias}/{todo.id}"
			data-sveltekit-preload-data="hover"
			data-sveltekit-noscroll
			class="block"
			onclick={handleCardClick}
		>
			<Card
				class="relative cursor-pointer transition-all duration-200 hover:shadow-md"
				onmouseenter={handleMouseEnter}
				onmouseleave={handleMouseLeave}
			>
				<Button
					variant="ghost"
					size="sm"
					onclick={confirmDeleteTodo}
					class="absolute top-1 right-1 z-10 h-6 w-6 p-0 transition-opacity hover:bg-red-50 hover:text-red-700 {isHovered
						? 'opacity-100'
						: 'opacity-0'}"
					onmousedown={preventDrag}
					ontouchstart={preventDrag}
				>
					<Trash2 class="h-3 w-3" />
					<span class="sr-only">{$t('common.delete')}</span>
				</Button>

				<CardContent class="pl-2">
					<div class="flex items-start gap-2">
						<DragHandle
							attributes={attributes.current}
							listeners={listeners.current}
							isVisible={isHovered}
						/>

						<button
							onclick={toggleComplete}
							class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-muted-foreground transition-colors hover:border-primary {todo.completed_at
								? 'border-primary bg-primary'
								: ''}"
							aria-label={todo.completed_at ? $t('todo.mark_incomplete') : $t('todo.mark_complete')}
						>
							{#if todo.completed_at}
								<Check class="h-3 w-3 text-primary-foreground" />
							{/if}
						</button>

						<div class="min-w-0 flex-1 pr-8">
							<h3
								class="text-sm leading-tight font-medium {todo.completed_at
									? 'text-muted-foreground line-through'
									: ''}"
							>
								{todo.title}
							</h3>

							{#if todo.content}
								<p
									class="mt-0.5 text-xs leading-tight text-muted-foreground {todo.completed_at
										? 'line-through'
										: ''}"
								>
									{shortenText(stripHtml(todo.content))}
								</p>
							{/if}

							{#if todo.due_on}
								<div class="mt-1 flex items-center gap-1">
									<Calendar class="h-2.5 w-2.5" />
									<Badge
										variant={isOverdue(todo.due_on) ? 'destructive' : 'secondary'}
										class="h-auto px-1 py-0 text-xs"
									>
										{formatDate(todo.due_on)}
									</Badge>
								</div>
							{/if}

							{#if todo.github_issue_number}
								<a
									href={todo.github_url}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
									onclick={(e) => e.stopPropagation()}
									title="View on GitHub"
								>
									<GithubIcon class="h-2.5 w-2.5" />
									<span>#{todo.github_issue_number}</span>
								</a>
							{/if}
						</div>

						<div
							class="absolute top-1 right-8 transition-opacity {isHovered
								? 'opacity-100'
								: 'opacity-0'}"
						>
							<Button
								variant="ghost"
								size="sm"
								onclick={startEdit}
								class="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-700"
							>
								<SquarePen class="h-3 w-3" />
								<span class="sr-only">{$t('common.edit')}</span>
							</Button>
						</div>
					</div>
					<div class="absolute right-3 bottom-2 flex items-center gap-1 text-xs text-gray-400">
						{#if todo.priority === 'high'}
							<div class="h-2 w-2 rounded-full bg-red-500"></div>
						{/if}

						{#if todo.comments.length > 0}
							<MessageSquareText class="h-3 w-3 text-muted-foreground" />
						{/if}

						{#if todo.uploads && todo.uploads.length > 0}
							<ImageIcon class="h-3 w-3 text-muted-foreground" />
						{/if}

						{#if todo.min_hours || todo.max_hours}
							<Clock class="h-3 w-3 text-muted-foreground" />
							<span>
								{#if todo.min_hours && todo.max_hours}
									~{((todo.min_hours + todo.max_hours) / 2).toFixed(1)}h
								{:else if todo.min_hours}
									{todo.min_hours}+h
								{:else if todo.max_hours}
									&lt;{todo.max_hours}h
								{/if}
							</span>
						{/if}
					</div>
				</CardContent>
			</Card>
		</a>
	{:else}
		<TodoEditForm
			{todo}
			bind:editData
			bind:validationErrors
			bind:images
			bind:isDragOver
			{isSubmitting}
			onSave={saveEdit}
			onCancel={cancelEdit}
			onKeydown={handleKeydown}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onFileSelect={handleFileSelect}
			onRemoveImage={removeImage}
			bind:fileInput
		/>
	{/if}
</div>

<ConfirmDialog
	bind:open={showDeleteConfirm}
	title={$t('todo.delete_task_title')}
	description={$t('todo.delete_task_description')}
	confirmText={$t('common.delete')}
	cancelText={$t('common.cancel')}
	variant="destructive"
	icon="delete"
	onConfirm={deleteTodo}
	onCancel={() => {}}
/>

<ConfirmDialog
	bind:open={showUnsavedChangesConfirm}
	title={$t('todo.unsaved_changes_title')}
	description={$t('todo.unsaved_changes_description')}
	confirmText={$t('common.discard_changes')}
	cancelText={$t('common.keep_editing')}
	variant="warning"
	icon="unsaved"
	onConfirm={handleConfirmAction}
	onCancel={handleCancelAction}
/>

<ConfirmDialog
	bind:open={showStartEditConfirm}
	title={$t('todo.unsaved_changes_title')}
	description={$t('todo.unsaved_changes_description')}
	confirmText={$t('common.discard_changes')}
	cancelText={$t('common.cancel')}
	variant="warning"
	icon="unsaved"
	onConfirm={handleConfirmAction}
	onCancel={handleCancelAction}
/>
