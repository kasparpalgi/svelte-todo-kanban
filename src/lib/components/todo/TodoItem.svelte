<!-- @file src/lib/components/todo/TodoItem.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { editingTodo } from '$lib/stores/states.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Check, SquarePen, Calendar, Trash2, ImageIcon } from 'lucide-svelte';
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
			.min(1, 'Title is required')
			.max(200, 'Title must be less than 200 characters')
			.trim(),
		content: z
			.string()
			.max(1000, 'Content must be less than 1000 characters')
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
				{ message: 'Invalid date format' }
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
				displayMessage(result.message || 'Failed to update todo');
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
					displayMessage('Upload completed successfully', 2000, true);
				} catch (error) {
					displayMessage('Some images failed to upload, but todo was saved');
					console.error('Upload error:', error);
				}
			} else {
				displayMessage('Todo updated successfully', 1500, true);
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
				displayMessage('An unexpected error occurred');
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function toggleComplete() {
		const result = await todosStore.toggleTodo(todo.id);
		if (!result.success) {
			displayMessage(result.message || 'Failed to update todo status');
		}
	}

	async function deleteTodo() {
		const result = await todosStore.deleteTodo(todo.id);
		if (!result.success) {
			displayMessage(result.message || 'Failed to delete todo');
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
			displayMessage('Some files were rejected: must be images under 5MB');
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

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays === -1) return 'Yesterday';
		if (diffDays > 0) return `In ${diffDays} days`;
		return `${Math.abs(diffDays)} days ago`;
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
			return;
		}
		goto(`/${lang}/${username}/${boardAlias}/${todo.id}`);
	}
</script>

<div
	use:setNodeRef
	{style}
	class="touch-none"
	class:opacity-50={sortableIsDragging.current || isDragging}
>
	{#if !isEditing}
		<Card
			class="cursor-pointer relative transition-all duration-200 hover:shadow-md"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			onclick={handleCardClick}
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
						aria-label={todo.completed_at ? 'Mark as incomplete' : 'Mark as complete'}
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
				<div class="absolute right-3 bottom-2">
					{#if todo.uploads && todo.uploads.length > 0}
						<ImageIcon class="mx-auto h-4 w-4 text-muted-foreground" />
					{/if}
				</div>
			</CardContent>
		</Card>
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
	title="Delete Task"
	description="Are you sure you want to delete this task? This action cannot be undone."
	confirmText="Delete"
	cancelText="Cancel"
	variant="destructive"
	icon="delete"
	onConfirm={deleteTodo}
	onCancel={() => {}}
/>

<ConfirmDialog
	bind:open={showUnsavedChangesConfirm}
	title="Unsaved Changes"
	description="You have unsaved changes. Are you sure you want to discard them?"
	confirmText="Discard Changes"
	cancelText="Keep Editing"
	variant="warning"
	icon="unsaved"
	onConfirm={handleConfirmAction}
	onCancel={handleCancelAction}
/>

<ConfirmDialog
	bind:open={showStartEditConfirm}
	title="Unsaved Changes"
	description="You have unsaved changes in another todo. Do you want to discard them and continue editing this one?"
	confirmText="Discard & Continue"
	cancelText="Cancel"
	variant="warning"
	icon="unsaved"
	onConfirm={handleConfirmAction}
	onCancel={handleCancelAction}
/>
