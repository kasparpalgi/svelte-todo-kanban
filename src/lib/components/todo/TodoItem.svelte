<!-- @file src/lib/components/todo/TodoItem.svelte -->
<script lang="ts">
	import { z } from 'zod';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { draggable, type DragEventData } from '@neodrag/svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { editingTodo } from '$lib/stores/states.svelte';
	import { formatDateWithFuture } from '$lib/utils/dateTime.svelte';
	import { shortenText } from '$lib/utils/shortenText';
	import { stripHtml } from '$lib/utils/stripHtml';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Check,
		SquarePen,
		Calendar,
		Trash2,
		ImageIcon,
		Clock,
		MessageSquareText,
		GripVertical
	} from 'lucide-svelte';
	import githubLogo from '$lib/assets/github.svg';
	import TodoEditForm from './TodoEditForm.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import type { TodoImage } from '$lib/types/imageUpload';
	import type { TodoItemProps } from '$lib/types/todo';

	let {
		todo,
		isDragging = false,
		showDropAbove = false,
		onDragStart,
		onDragEnd,
		onDelete
	}: TodoItemProps = $props();

	const lang = $derived(page.params.lang || 'et');
	const username = $derived(page.params.username);
	const boardAlias = $derived(page.params.board);

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
	let showDeleteConfirm = $state(false);
	let showUnsavedChangesConfirm = $state(false);
	let showStartEditConfirm = $state(false);
	let pendingAction = $state<(() => void) | null>(null);
	let cardEl = $state<HTMLElement>();
	let dragKey = $state(0);
	let dragStartTime = $state(0);
	let isDraggingLocal = $state(false);

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

	function handleNeodragStart(data: DragEventData) {
		if (isEditing) return;
		isDraggingLocal = true;
		dragStartTime = Date.now();
		onDragStart(todo);
	}

	function handleNeodragEnd(data: DragEventData) {
		isDraggingLocal = false;
		dragStartTime = 0;

		if (isEditing) return;

		onDragEnd();

		setTimeout(() => {
			dragKey++;
		}, 100);
	}

	function handleTouchEnd(e: TouchEvent) {
		// Safety net: If touch ends but neodrag didn't fire its end event
		if (isDraggingLocal && dragStartTime > 0) {
			const dragDuration = Date.now() - dragStartTime;

			if (dragDuration > 100) {
				setTimeout(() => {
					if (isDraggingLocal) {
						isDraggingLocal = false;
						dragStartTime = 0;
						dragKey++;
					}
				}, 200);
			}
		}
	}

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
		onDelete(todo.id);
	}

	function confirmDeleteTodo() {
		showDeleteConfirm = true;
	}

	function handleFileDropOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleFileDropLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleFileDrop(event: DragEvent) {
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
		goto(`/${lang}/${username}/${boardAlias}?card=${todo.id}`);
	}
</script>

<div class="relative {isDragging || isDraggingLocal ? 'z-50' : ''}">
	{#if showDropAbove}
		<div
			class="absolute right-0 left-0 z-50 h-0.5 bg-primary shadow-lg shadow-primary/50"
			style="top: -4px;"
		></div>
	{/if}

	{#key dragKey}
		<div
			bind:this={cardEl}
			data-todo-id={todo.id}
			use:draggable={{
				disabled: isEditing,
				handle: '.drag-handle',
				onDragStart: handleNeodragStart,
				onDragEnd: handleNeodragEnd,
				applyUserSelectHack: true,
				position: { x: 0, y: 0 },
				defaultPosition: { x: 0, y: 0 },
				ignoreMultitouch: true
			}}
			ontouchend={handleTouchEnd}
			class="mt-2 {isDragging || isDraggingLocal ? 'opacity-50' : ''}"
			style={isDragging || isDraggingLocal
				? 'pointer-events: none !important; touch-action: none;'
				: ''}
		>
			{#if !isEditing}
				<a
					href="/{lang}/{username}/{boardAlias}?card={todo.id}"
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
						>
							<Trash2 class="h-3 w-3" />
							<span class="sr-only">{$t('common.delete')}</span>
						</Button>

						<CardContent class="pt-2 pb-6 pl-2">
							<div class="flex items-start gap-2">
								<button
									class="drag-handle mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity hover:text-foreground active:cursor-grabbing max-md:flex max-md:h-5 max-md:w-5 max-md:items-center max-md:justify-center max-md:rounded max-md:bg-muted/30 max-md:!opacity-100 md:opacity-0 md:group-hover:opacity-100 {isHovered
										? 'md:opacity-100'
										: ''}"
								>
									<GripVertical class="h-3 w-3 max-md:h-4 max-md:w-4" />
								</button>

								<button
									onclick={toggleComplete}
									class="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-muted-foreground transition-colors hover:border-primary {todo.completed_at
										? 'border-primary bg-primary'
										: ''}"
									aria-label={todo.completed_at
										? $t('todo.mark_incomplete')
										: $t('todo.mark_complete')}
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
												{formatDateWithFuture(todo.due_on)}
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

							<div class="absolute bottom-2 left-3">
								{#if todo.github_issue_number}
									<a
										href={todo.github_url}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
										onclick={(e) => e.stopPropagation()}
										title="View on GitHub"
									>
										<img src={githubLogo} alt="GitHub" class="h-3 w-3 opacity-25 filter" />
										<span>#{todo.github_issue_number}</span>
									</a>
								{/if}
							</div>

							<!-- Bottom right - Labels and Icons -->
							<div class="absolute right-3 bottom-2 flex items-center gap-2 text-xs text-gray-400">
								{#if todo.labels && todo.labels.length > 0}
									<div class="flex items-center gap-0.5">
										{#each todo.labels as label (label.label.id)}
											<span class="font-mono text-xs" style:color={`${label.label.color}`}>
												{label.label.name.charAt(0).toUpperCase()}
											</span>
										{/each}
									</div>
								{/if}

								<div class="flex items-center gap-1">
									{#if todo.priority === 'high'}
										<div class="h-2 w-2 rounded-full bg-red-500" title="High Priority"></div>
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
					onDragOver={handleFileDropOver}
					onDragLeave={handleFileDropLeave}
					onDrop={handleFileDrop}
					onFileSelect={handleFileSelect}
					onRemoveImage={removeImage}
					bind:fileInput
				/>
			{/if}
		</div>
	{/key}
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
