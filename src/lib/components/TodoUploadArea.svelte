<!-- src/lib/components/TodoUploadArea.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { X, Upload, Image } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import type { UploadProps } from '$lib/types/imageUpload';

	let {
		images = $bindable([]),
		isDragOver = $bindable(false),
		onDragOver,
		onDragLeave,
		onDrop,
		onFileSelect,
		onRemoveImage,
		fileInput = $bindable()
	}: UploadProps = $props();

	async function uploadImages(): Promise<string[]> {
		const uploadPromises = images
			.filter((img) => !img.isExisting && img.file)
			.map(async (img) => {
				try {
					img.isUploading = true;
					images = [...images];

					const formData = new FormData();
					formData.append('file', img.file!);

					const response = await fetch('/api/upload', {
						method: 'POST',
						body: formData
					});

					const result = await response.json();

					if (result.success) {
						return result.url;
					} else {
						throw new Error(result.error || 'Upload failed');
					}
				} catch (error) {
					console.error('Upload error:', error);
					displayMessage(
						`Failed to upload ${img.file?.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
					return null;
				} finally {
					img.isUploading = false;
					images = [...images];
				}
			});

		const results = await Promise.all(uploadPromises);
		return results.filter((url): url is string => url !== null);
	}

	export { uploadImages };
</script>

<div
	role="button"
	tabindex="0"
	aria-label="Upload images by dragging and dropping or clicking to browse"
	class="cursor-pointer rounded-lg border-2 border-dashed p-4 transition-colors {isDragOver
		? 'border-primary bg-primary/5'
		: 'border-muted-foreground/25'} hover:border-primary/50 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	onclick={() => fileInput?.click()}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fileInput?.click();
		}
	}}
>
	<div class="text-center">
		<Upload class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
		<p class="mb-2 text-sm text-muted-foreground">
			Drag and drop images here, or
			<Button variant="link" class="h-auto p-0" onclick={() => fileInput?.click()}>
				browse files
			</Button>
		</p>
		<p class="text-xs text-muted-foreground">Maximum 5MB per image</p>
	</div>

	<input
		bind:this={fileInput}
		type="file"
		multiple
		accept="image/*"
		class="hidden"
		onchange={onFileSelect}
	/>
</div>

<!-- Image Previews -->
{#if images.length > 0}
	<div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
		{#each images as image (image.id)}
			<div class="group relative">
				<div class="aspect-square overflow-hidden rounded-lg border bg-muted">
					<img
						src={image.preview}
						alt="Upload preview"
						class="h-full w-full object-cover"
						class:opacity-50={image.isUploading}
					/>
					{#if image.isUploading}
						<div class="absolute inset-0 flex items-center justify-center bg-black/20">
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
						</div>
					{/if}
				</div>

				{#if !image.isUploading}
					<Button
						variant="destructive"
						size="sm"
						class="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
						onclick={() => onRemoveImage(image.id)}
					>
						<X class="h-3 w-3" />
					</Button>
				{/if}

				{#if image.isExisting}
					<div class="absolute bottom-1 left-1">
						<div class="rounded bg-black/50 px-1 py-0.5 text-xs text-white">
							<Image class="inline h-3 w-3" />
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
