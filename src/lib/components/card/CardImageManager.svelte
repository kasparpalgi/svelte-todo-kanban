<!-- @file src/lib/components/card/CardImageManager.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { t } from '$lib/i18n';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { X, ImageIcon, Upload } from 'lucide-svelte';
	import type { TodoImage } from '$lib/types/imageUpload';
	import type { CardImageProps } from '$lib/types/todo';

	let { todoId, initialImages = [] }: CardImageProps = $props();

	let images = $state<TodoImage[]>(initialImages);
	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let showUploadArea = $state(false);
	let selectedImage = $state<TodoImage | null>(null);

	onDestroy(() => {
		images.forEach((img) => {
			if (!img.isExisting && img.preview.startsWith('blob:')) {
				URL.revokeObjectURL(img.preview);
			}
		});
	});

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
			if (image.isExisting) {
				todosStore.deleteUpload(imageId, todoId);
			} else {
				if (image.preview.startsWith('blob:')) {
					URL.revokeObjectURL(image.preview);
				}
			}
			images = images.filter((img) => img.id !== imageId);
		}
	}

	export function getNewImages(): TodoImage[] {
		return images.filter((img) => !img.isExisting && img.file);
	}

	export function getAllImages(): TodoImage[] {
		return images;
	}
</script>

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

{#if selectedImage}
	<Dialog open={!!selectedImage} onOpenChange={() => (selectedImage = null)}>
		<DialogContent class="max-w-4xl">
			<img src={selectedImage.preview} alt={$t('common.full_size')} class="w-full rounded" />
		</DialogContent>
	</Dialog>
{/if}
