<!-- @file src/lib/components/TodoEditForm.svelte -->
<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Check, X, Image as ImageIcon } from 'lucide-svelte';
	import type { TodoEditProps } from '$lib/types/todo';

	let {
		todo,
		editData = $bindable(),
		validationErrors = $bindable(),
		images = $bindable(),
		isDragOver = $bindable(),
		isSubmitting,
		onSave,
		onCancel,
		onKeydown,
		onDragOver,
		onDragLeave,
		onDrop,
		onFileSelect,
		onRemoveImage,
		fileInput = $bindable()
	}: TodoEditProps = $props();
</script>

<div role="dialog" aria-label="Edit todo: {todo.title}" onkeydown={onKeydown} tabindex="0">
	<Card class="group relative transition-all duration-200">
		<CardContent class="p-4">
			<div class="space-y-3">
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
						rows={2}
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
					<label for="due-date-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
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
					<span class="mb-2 block text-sm font-medium text-foreground">Images</span>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center transition-colors {isDragOver
							? 'border-primary bg-primary/5'
							: ''}"
						ondragover={onDragOver}
						ondragleave={onDragLeave}
						ondrop={onDrop}
					>
						<ImageIcon class="mx-auto h-6 w-6 text-muted-foreground" />
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
							onchange={onFileSelect}
							class="hidden"
						/>
					</div>

					<!-- Image Previews -->
					{#if images.length > 0}
						<div class="mt-3 grid grid-cols-4 gap-2">
							{#each images as image (image.id)}
								<div class="group relative">
									<img
										src={image.preview}
										alt="Preview"
										class="aspect-square w-full rounded border object-cover"
									/>
									<button
										onclick={() => onRemoveImage(image.id)}
										class="text-destructive-foreground absolute -top-1 -right-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90"
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
				<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						onclick={onCancel}
						disabled={isSubmitting}
						class="order-2 sm:order-1"
					>
						Cancel
					</Button>
					<Button onclick={onSave} disabled={isSubmitting} class="order-1 sm:order-2">
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
		</CardContent>
	</Card>
</div>
