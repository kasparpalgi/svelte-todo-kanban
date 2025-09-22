<!-- @file src/lib/components/TodoItem.svelte -->
<script lang="ts">
	import { todosStore } from '$lib/stores/todos.svelte';
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Check, X, Edit, Calendar, Image as ImageIcon, GripVertical } from 'lucide-svelte';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { z } from 'zod';
	import type { TodoItemProps } from '$lib/types/todo';

	let { todo, isDragging = false }: TodoItemProps = $props();

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
	let images = $state<
		Array<{ id: string; file: File | null; preview: string; isExisting?: boolean }>
	>([]);
	let validationErrors = $state<Record<string, string>>({});
	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let isSubmitting = $state(false);

	let style = $derived(transform.current ? CSS.Transform.toString(transform.current) : '');

	// Reset edit data when todo changes (but only if not editing)
	$effect(() => {
		if (!isEditing) {
			editData = {
				title: todo.title,
				content: todo.content || '',
				due_on: todo.due_on ? new Date(todo.due_on).toISOString().split('T')[0] : ''
			};
		}
	});

	// Cleanup blob URLs on destroy
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
		// Reset images to existing uploads
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
		// Clean up blob URLs for new images
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

		// Validate form data
		try {
			const validatedData = todoEditSchema.parse(editData);
			validationErrors = {};

			isSubmitting = true;

			// Prepare update data
			const updateData: any = {
				title: validatedData.title,
				content: validatedData.content || null,
				due_on: validatedData.due_on || null
			};

			// TODO: Handle image uploads here
			// For now, we just save the other fields
			const result = await todosStore.updateTodo(todo.id, updateData);

			if (result.success) {
				isEditing = false;
				// Clean up blob URLs for new images
				images.forEach((img) => {
					if (!img.isExisting && img.preview.startsWith('blob:')) {
						URL.revokeObjectURL(img.preview);
					}
				});
				images = [];
			} else {
				// Handle error - could show a toast or error message
				console.error('Failed to update todo:', result.message);
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

	async function toggleComplete() {
		await todosStore.toggleTodo(todo.id);
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
		target.value = ''; // Reset input
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

		// Show error for invalid files
		const invalidFiles = files.filter(
			(file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
		);
		if (invalidFiles.length > 0) {
			// Could show a toast notification here
			console.warn('Some files were rejected: must be images under 5MB');
		}
	}

	function removeImage(imageId: string) {
		const image = images.find((img) => img.id === imageId);
		if (image && !image.isExisting && image.preview.startsWith('blob:')) {
			URL.revokeObjectURL(image.preview);
		}
		images = images.filter((img) => img.id !== imageId);
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

	// Keyboard shortcuts - only when editing
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancelEdit();
		} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			saveEdit();
		}
	}
</script>

<div
	use:setNodeRef
	{style}
	class="group flex items-center gap-3 rounded-lg transition-colors hover:bg-muted/50"
	class:opacity-50={sortableIsDragging.current || isDragging}
	class:shadow-lg={sortableIsDragging.current || isDragging}
>
	<Card class="group relative transition-all duration-200 hover:shadow-md">
		{#if !isEditing}
			<!-- Display Mode -->
			<CardContent class="p-4">
				<div class="flex items-start gap-3">
					<!-- Drag Handle -->
					<button
						class="cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground active:cursor-grabbing"
						{...attributes.current}
						{...listeners.current}
					>
						<GripVertical class="h-4 w-4" />
					</button>

					<!-- Checkbox -->
					<button
						onclick={toggleComplete}
						class="mt-1 flex h-4 w-4 items-center justify-center rounded border-2 border-muted-foreground transition-colors hover:border-primary {todo.completed_at
							? 'border-primary bg-primary'
							: ''}"
						aria-label={todo.completed_at ? 'Mark as incomplete' : 'Mark as complete'}
					>
						{#if todo.completed_at}
							<Check class="h-3 w-3 text-primary-foreground" />
						{/if}
					</button>

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<h3 class="font-medium {todo.completed_at ? 'text-muted-foreground line-through' : ''}">
							{todo.title}
						</h3>

						{#if todo.content}
							<p
								class="mt-1 text-sm text-muted-foreground {todo.completed_at ? 'line-through' : ''}"
							>
								{todo.content}
							</p>
						{/if}

						<!-- Due date -->
						{#if todo.due_on}
							<div class="mt-2 flex items-center gap-1 text-xs">
								<Calendar class="h-3 w-3" />
								<Badge
									variant={isOverdue(todo.due_on) ? 'destructive' : 'secondary'}
									class="text-xs"
								>
									{formatDate(todo.due_on)}
								</Badge>
							</div>
						{/if}

						<!-- Images -->
						{#if todo.uploads && todo.uploads.length > 0}
							<div class="mt-2 flex gap-2">
								{#each todo.uploads as upload}
									<img
										src={upload.url}
										alt="Todo attachment"
										class="h-16 w-16 rounded border object-cover"
									/>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<Button variant="ghost" size="sm" onclick={startEdit} class="h-8 w-8 p-0">
							<Edit class="h-3 w-3" />
						</Button>
					</div>
				</div>
			</CardContent>
		{:else}
			<!-- Edit Mode -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				role="dialog"
				aria-label="Edit todo: {todo.title}"
				onkeydown={handleKeydown}
				tabindex="0"
			>
				<CardContent class="p-4">
					<div class="space-y-4">
						<!-- Title -->
						<div>
							<label for="title-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
								Title *
							</label>
							<Input
								id="title-{todo.id}"
								bind:value={editData.title}
								placeholder="Task title"
								class={validationErrors.title
									? 'border-destructive focus-visible:ring-destructive'
									: ''}
								disabled={isSubmitting}
								autofocus
							/>
							{#if validationErrors.title}
								<p class="mt-1 text-xs text-destructive" role="alert">{validationErrors.title}</p>
							{/if}
						</div>

						<!-- Content -->
						<div>
							<label for="content-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
								Description
							</label>
							<Textarea
								id="content-{todo.id}"
								bind:value={editData.content}
								placeholder="Task description (optional)"
								rows={3}
								class={validationErrors.content
									? 'border-destructive focus-visible:ring-destructive'
									: ''}
								disabled={isSubmitting}
							/>
							{#if validationErrors.content}
								<p class="mt-1 text-xs text-destructive" role="alert">{validationErrors.content}</p>
							{/if}
						</div>

						<!-- Due Date -->
						<div>
							<label
								for="due-date-{todo.id}"
								class="mb-1 block text-sm font-medium text-foreground"
							>
								Due Date
							</label>
							<Input
								id="due-date-{todo.id}"
								type="date"
								bind:value={editData.due_on}
								class={validationErrors.due_on
									? 'border-destructive focus-visible:ring-destructive'
									: ''}
								disabled={isSubmitting}
							/>
							{#if validationErrors.due_on}
								<p class="mt-1 text-xs text-destructive" role="alert">{validationErrors.due_on}</p>
							{/if}
						</div>

						<!-- Image Upload -->
						<div>
							<span class="mb-2 block text-sm font-medium text-foreground"> Images </span>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors {isDragOver
									? 'border-primary bg-primary/5'
									: ''}"
								ondragover={handleDragOver}
								ondragleave={handleDragLeave}
								ondrop={handleDrop}
							>
								<ImageIcon class="mx-auto h-8 w-8 text-muted-foreground" />
								<p class="mt-2 text-sm text-muted-foreground">
									Drag and drop images here, or
									<button
										type="button"
										onclick={() => fileInput?.click()}
										class="text-primary hover:underline focus:underline focus:outline-none"
									>
										click to select
									</button>
								</p>
								<p class="mt-1 text-xs text-muted-foreground">PNG, JPG up to 5MB each</p>
								<input
									bind:this={fileInput}
									type="file"
									multiple
									accept="image/*"
									onchange={handleFileSelect}
									class="hidden"
								/>
							</div>

							<!-- Image Previews -->
							{#if images.length > 0}
								<div class="mt-4 grid grid-cols-3 gap-2">
									{#each images as image (image.id)}
										<div class="group relative">
											<img
												src={image.preview}
												alt="Preview"
												class="aspect-square w-full rounded border object-cover"
											/>
											<button
												onclick={() => removeImage(image.id)}
												class="text-destructive-foreground absolute -top-2 -right-2 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90"
												type="button"
											>
												<X class="h-3 w-3" />
											</button>
											{#if image.isExisting}
												<div
													class="absolute bottom-1 left-1 rounded bg-background/80 px-1 py-0.5 text-xs"
												>
													Current
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="space-y-3">
							<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
								<Button
									variant="outline"
									onclick={cancelEdit}
									disabled={isSubmitting}
									class="order-2 sm:order-1"
								>
									Cancel
								</Button>
								<Button onclick={saveEdit} disabled={isSubmitting} class="order-1 sm:order-2">
									{#if isSubmitting}
										<div
											class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
										></div>
										Saving...
									{:else}
										<Check class="mr-2 h-4 w-4" />
										Save
									{/if}
								</Button>
							</div>
							<p class="text-center text-xs text-muted-foreground sm:text-right">
								Press <kbd class="rounded bg-muted px-1 py-0.5 text-xs">Esc</kbd> to cancel,
								<kbd class="rounded bg-muted px-1 py-0.5 text-xs">Ctrl+Enter</kbd> to save
							</p>
						</div>
					</div>
				</CardContent>
			</div>
		{/if}
	</Card>
</div>
