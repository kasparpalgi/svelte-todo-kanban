<!-- @file src/lib/components/TodoEditForm.svelte -->
<script lang="ts">
	import { scale } from 'svelte/transition';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogTrigger } from '$lib/components/ui/dialog';
	import { Check, X, Image as ImageIcon, Upload, Trash2 } from 'lucide-svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import VoiceInput from './VoiceInput.svelte';
	import AITaskButton from './AITaskButton.svelte';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import type { TodoEditProps } from '$lib/types/todo';
	import type { Readable } from 'svelte/store';
	import type { Editor } from 'svelte-tiptap';

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
	let saveButtonText = $derived(hasNewImages ? $t('todo.upload_and_save') : $t('common.save'));
	let showImageDeleteConfirm = $state(false);
	let imageToDelete = $state<string>('');
	let titleInputEl: any;
	let editor: Readable<Editor> | null = $state(null);

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
		setTimeout(() => {
			if (titleInputEl && typeof titleInputEl.focus === 'function') {
				titleInputEl.focus();
			}
		}, 100);
	}

	function handleContentVoice(transcript: string) {
		if (editor) {
			const editorInstance = get(editor);
			// Insert at cursor position instead of replacing all content
			editorInstance.commands.insertContent(transcript);
		}
	}

	function getEditorContext(): { contentBefore: string; contentAfter: string } {
		if (!editor) return { contentBefore: '', contentAfter: '' };

		const editorInstance = get(editor);
		const { from } = editorInstance.state.selection;
		const doc = editorInstance.state.doc;

		// Get text content before cursor
		const contentBefore = doc.textBetween(0, from, '\n');
		// Get text content after cursor
		const contentAfter = doc.textBetween(from, doc.content.size, '\n');

		return { contentBefore, contentAfter };
	}

	function handleVoiceError(error: string) {
		displayMessage(error, 3000, false);
	}

	function handleAITaskResult(result: string) {
		if (editor) {
			const editorInstance = get(editor);
			// Insert AI task result at cursor position
			editorInstance.commands.insertContent(result);
		}
	}

	function getCleanContent(): string {
		if (!editor) return '';
		const editorInstance = get(editor);
		// Get text content without HTML tags
		return editorInstance.getText();
	}

	function handleSave() {
		if (editor) {
			editData.content = get(editor).getHTML();
		}
		onSave();
	}

	function handleKeydownLocal(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onCancel();
			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			if (!isSubmitting) {
				handleSave();
			}
			return;
		}

		if (onKeydown) {
			onKeydown(event);
		}
	}
</script>

<div
	role="dialog"
	aria-label={$t('todo.edit_todo') + ' ' + todo.title}
	onkeydown={handleKeydownLocal}
	tabindex="0"
>
	<Card class="group relative transition-all duration-200">
		<CardContent class="p-4">
			<div class="space-y-3">
				<div>
					<label for="title-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
						{$t('todo.title_label')}
					</label>
					<div class="flex gap-2">
						<Input
							bind:this={titleInputEl}
							id="title-{todo.id}"
							bind:value={editData.title}
							placeholder={$t('todo.task_title_placeholder')}
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
							minimal={true}
						/>
					</div>
					{#if validationErrors.title}
						<p class="mt-1 text-xs text-destructive" role="alert">{validationErrors.title}</p>
					{/if}
				</div>

				<div>
					<label for="content-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
						{$t('todo.description_label')}
					</label>
					<div class="space-y-2">
						<RichTextEditor bind:editor content={editData.content} showToolbar={false} />
						<div
							class="flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-2"
						>
							{#if editor}
								{@const context = getEditorContext()}
								<VoiceInput
									onTranscript={handleContentVoice}
									onError={handleVoiceError}
									disabled={isSubmitting}
									title={editData.title || ''}
									contentBefore={context.contentBefore}
									contentAfter={context.contentAfter}
									useContextualCorrection={true}
								/>
							{:else}
								<VoiceInput
									onTranscript={handleContentVoice}
									onError={handleVoiceError}
									disabled={isSubmitting}
									title={editData.title || ''}
								/>
							{/if}
							<AITaskButton
								onResult={handleAITaskResult}
								title={editData.title || ''}
								content={getCleanContent()}
								disabled={isSubmitting}
								minimal={true}
							/>
							<div class="flex-1"></div>
							<span class="text-xs text-muted-foreground">
								{$t('ai.toolbar_hint') || 'Voice input or AI task'}
							</span>
						</div>
					</div>
					{#if validationErrors.content}
						<p class="mt-1 text-xs text-destructive" role="alert">{validationErrors.content}</p>
					{/if}
				</div>

				<!-- Due Date -->
				<div>
					<label for="due-date-{todo.id}" class="mb-1 block text-sm font-medium text-foreground">
						{$t('todo.due_date_label')}
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
						<span class="mb-2 block text-sm font-medium text-foreground"
							>{$t('todo.attached_images')}</span
						>
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
													alt={$t('common.image') + ' ' + image.file}
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
														{$t('todo.remove_image')}
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
						<span class="mb-2 block text-sm font-medium text-foreground"
							>{$t('todo.images_to_upload')}</span
						>
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
											aria-label={$t('todo.remove_image')}
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
						<span class="mb-2 block text-sm font-medium text-foreground"
							>{$t('todo.add_images_files')}</span
						>
						<div
							tabindex="0"
							aria-label={$t('todo.upload_drag_drop')}
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
								{$t('todo.drag_drop_images')}
								<button
									type="button"
									onclick={() => fileInput?.click()}
									class="text-primary hover:underline focus:underline focus:outline-none"
								>
									{$t('todo.click_to_select')}
								</button>
							</p>
							<p class="mt-1 text-xs text-muted-foreground">{$t('todo.image_size_limit')}</p>
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
						{$t('todo.attach_images_files')}
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
						{$t('common.cancel')}
					</Button>
					<Button onclick={handleSave} disabled={isSubmitting} class="order-1 sm:order-2">
						{#if isSubmitting}
							<div
								class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							></div>
							{$t('common.saving')}
						{:else}
							<Check class="mr-2 h-4 w-4" />
							{saveButtonText}
						{/if}
					</Button>
				</div>
				<p class="text-center text-xs text-muted-foreground sm:text-right">
					{@html $t('todo.keyboard_hint_esc')}
					{@html $t('todo.keyboard_hint_save')}
				</p>
			</div>
		</CardContent>
	</Card>
</div>

<ConfirmDialog
	bind:open={showImageDeleteConfirm}
	title={$t('todo.remove_image')}
	description={$t('todo.remove_image_description')}
	confirmText={$t('common.remove')}
	cancelText={$t('common.cancel')}
	variant="destructive"
	icon="delete"
	onConfirm={handleConfirmImageDelete}
	onCancel={handleCancelImageDelete}
/>
