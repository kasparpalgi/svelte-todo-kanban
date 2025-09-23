<!-- @file src/lib/components/todo/TodoItem.svelte -->
<script lang="ts">
	import { PUBLIC_FULL_CARD_DRAGGABLE } from '$env/static/public';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Check, SquarePen, Calendar, Trash2 } from 'lucide-svelte';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { z } from 'zod';
	import { t } from '$lib/i18n';
	import TodoEditForm from './TodoEditForm.svelte';
	import DragHandle from './DragHandle.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import type { TodoItemProps } from '$lib/types/todo';
	import type { TodoImage } from '$lib/types/imageUpload';

	let { todo, isDragging = false }: TodoItemProps = $props();

	const enableFullCardDrag = PUBLIC_FULL_CARD_DRAGGABLE === 'true';
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

	let isEditing = $state(false);
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
	let style = $derived(transform.current ? CSS.Transform.toString(transform.current) : '');

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

	function startEdit() {
		isEditing = true;
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
		isEditing = false;
		editData = {
			title: todo.title,
			content: todo.content || '',
			due_on: todo.due_on ? new Date(todo.due_on).toISOString().split('T')[0] : ''
		};
		images.forEach((img) => {
			if (!img.isExisting && img.preview.startsWith('blob:')) {
				URL.revokeObjectURL(img.preview);
			}
		});
		images = [];
		validationErrors = {};
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
				} catch (error) {
					displayMessage('Some images failed to upload, but todo was saved');
					console.error('Upload error:', error);
				}
			}

			isEditing = false;
			images.forEach((img) => {
				if (!img.isExisting && img.preview.startsWith('blob:')) {
					URL.revokeObjectURL(img.preview);
				}
			});
			images = [];
			displayMessage('Todo updated successfully', 1500, true);
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
		if (confirm($t('todo.confirm_delete') || 'Are you sure you want to delete this task?')) {
			const result = await todosStore.deleteTodo(todo.id);
			if (!result.success) {
				displayMessage(result.message || 'Failed to delete todo');
			}
		}
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
				// TODO: delete from S3
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
</script>

<div
	use:setNodeRef
	{style}
	class="touch-none"
	class:opacity-50={sortableIsDragging.current || isDragging}
>
	{#if !isEditing}
		<Card class="group relative transition-all duration-200 hover:shadow-md">
			<Button
				variant="ghost"
				size="sm"
				onclick={deleteTodo}
				class="absolute top-1 right-1 z-10 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
				onmousedown={preventDrag}
				ontouchstart={preventDrag}
			>
				<Trash2 class="h-3 w-3" />
				<span class="sr-only">{$t('todo.delete')}</span>
			</Button>

			<CardContent
				class="pl-2 {enableFullCardDrag ? 'cursor-grab active:cursor-grabbing' : ''}"
				{...enableFullCardDrag ? attributes.current : {}}
				{...enableFullCardDrag ? listeners.current : {}}
			>
				<div class="flex items-start gap-2">
					<DragHandle
						attributes={enableFullCardDrag ? {} : attributes.current}
						listeners={enableFullCardDrag ? {} : listeners.current}
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
								{todo.content}
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

						{#if todo.uploads && todo.uploads.length > 0}
							<div class="mt-1 flex gap-1">
								{#each todo.uploads as upload}
									<img
										src={upload.url}
										alt="Todo attachment"
										class="h-8 w-8 rounded border object-cover"
									/>
								{/each}
							</div>
						{/if}
					</div>

					<div class="absolute top-1 right-8 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							variant="ghost"
							size="sm"
							onclick={startEdit}
							class="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-700"
						>
							<SquarePen class="h-3 w-3" />
							<span class="sr-only">{$t('todo.edit')}</span>
						</Button>
					</div>
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
