<script lang="ts">
	import { scale } from 'svelte/transition';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogTrigger } from '$lib/components/ui/dialog';
	import { Check, X, Image as ImageIcon, Upload, Trash2 } from 'lucide-svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import VoiceInput from './VoiceInput.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
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

	let showUploadArea = $state(false);
	let existingImages = $derived(images.filter((img) => img.isExisting));
	let newImages = $derived(images.filter((img) => !img.isExisting));
	let hasNewImages = $derived(newImages.length > 0);
	let saveButtonText = $derived(hasNewImages ? 'Upload & Save' : 'Save');
	let showImageDeleteConfirm = $state(false);
	let imageToDelete = $state<string>('');
	let titleInputEl: HTMLInputElement;
	let contentInputEl: HTMLTextAreaElement;

	function confirmRemoveImage(imageId: string) {
		const image = images.find((img) => img.id === imageId);
		if (image?.isExisting) {
			imageToDelete = imageId;
			showImageDeleteConfirm = true;
		} else {
			onRemoveImage(imageId);
		}
	}

	function handleConfirmImageDelete() {
		if (imageToDelete) {
			onRemoveImage(imageToDelete);
			imageToDelete = '';
		}
	}

	function handleCancelImageDelete() {
		imageToDelete = '';
	}

	function handleTitleVoice(transcript: string) {
		editData.title = transcript;
		setTimeout(() => titleInputEl?.focus(), 100);
	}

	function handleContentVoice(transcript: string) {
		editData.content = transcript;
		setTimeout(() => contentInputEl?.focus(), 100);
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
	}
</script>

<div role="dialog" aria-label="Edit todo: {todo.title}" onkeydown={onKeydown} tabindex="0">
	<Card class="group relative transition-all duration-200">
		<CardContent class="p-4">
			<div class="space-y-3">
				<div>
					<label for="title-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
						Title *
					</label>
					<div class="flex gap-2">
						<Input
							bind:this={titleInputEl}
							id="title-{todo.id}"
							bind:value={editData.title}
							placeholder="Task title"
							class="flex-1 {validationErrors.title
								? 'border-destructive focus-visible:ring-destructive'
								: ''}"
							disabled={isSubmitting}
							autofocus
						/>
						<VoiceInput
							onTranscript={handleTitleVoice}
							onError={handleVoiceError}
							disabled={isSubmitting}
						/>
					</div>
					{#if validationErrors.title}
						<p class="mt-1 text-xs text-destructive" role="alert">{validationErrors.title}</p>
					{/if}
				</div>

				<div>
					<label for="content-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
						Description
					</label>
					<div class="space-y-2">
						<Textarea
							bind:this={contentInputEl}
							id="content-{todo.id}"
							bind:value={editData.content}
							placeholder="Task description (optional)"
							rows={2}
							class={validationErrors.content
								? 'border-destructive focus-visible:ring-destructive'
								: ''}
							disabled={isSubmitting}
						/>
						<div class="flex justify-start">
							<VoiceInput
								onTranscript={handleContentVoice}
								onError={handleVoiceError}
								disabled={isSubmitting}
							/>
						</div>
					</div>
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

				{#if existingImages.length > 0}
					<div>
						<span class="mb-2 block text-sm font-medium text-foreground">Attached Images</span>
						<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
							{#each existingImages as image (image.id)}
								<div class="group relative">
									<Dialog>
										<DialogTrigger>
											<div
												class="aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition-transform hover:scale-105"
											>
												<img src={image.preview} alt="" class="h-full w-full object-cover" />
											</div>
										</DialogTrigger>
										<DialogContent class="max-w-4xl">
											<div class="flex flex-col items-center">
												<img
													src={image.preview}
													alt="Image {image.file}"
													class="max-h-[70vh] w-full object-contain p-4"
												/>
												<div class="mt-4">
													<Button
														variant="destructive"
														size="sm"
														onclick={() => confirmRemoveImage(image.id)}
														class="rounded-full"
													>
														<Trash2 class="mr-2 h-4 w-4" />
														Remove Image
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if newImages.length > 0}
					<div>
						<span class="mb-2 block text-sm font-medium text-foreground">Images to Upload</span>
						<div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
							{#each newImages as image (image.id)}
								<div class="group relative">
									<div class="aspect-square overflow-hidden rounded border bg-muted">
										<img
											src={image.preview}
											alt=""
											class="h-full w-full object-cover"
											class:opacity-50={image.isUploading}
										/>
										{#if image.isUploading}
											<div class="absolute inset-0 flex items-center justify-center bg-black/20">
												<div
													class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
												></div>
											</div>
										{/if}
									</div>

									{#if !image.isUploading}
										<button
											onclick={() => confirmRemoveImage(image.id)}
											class="text-destructive-foreground absolute -top-1 -right-1 rounded-full bg-destructive p-1"
											type="button"
										>
											<X class="h-3 w-3" />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if showUploadArea}
					<div in:scale>
						<span class="mb-2 block text-sm font-medium text-foreground">Add Images / Files</span>
						<div
							tabindex="0"
							aria-label="Upload images by dragg'n'drop or click to browse"
							role="button"
							class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center transition-colors {isDragOver
								? 'border-primary bg-primary/5'
								: ''}"
							ondragover={onDragOver}
							ondragleave={onDragLeave}
							ondrop={onDrop}
						>
							<Upload class="mx-auto h-6 w-6 text-muted-foreground" />
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
					</div>
				{:else}
					<Button
						variant="link"
						class="flex h-auto justify-start p-0 text-muted-foreground"
						onclick={() => (showUploadArea = true)}
					>
						<ImageIcon class="mr-2 h-4 w-4" />
						Attach images/files
					</Button>
				{/if}

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
							{saveButtonText}
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

<ConfirmDialog
	bind:open={showImageDeleteConfirm}
	title="Remove Image"
	description="Are you sure you want to remove this image? This action cannot be undone."
	confirmText="Remove"
	cancelText="Cancel"
	variant="destructive"
	icon="delete"
	onConfirm={handleConfirmImageDelete}
	onCancel={handleCancelImageDelete}
/>
