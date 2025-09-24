<!-- src/lib/components/todo/TodoUploadArea.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent, DialogTrigger } from '$lib/components/ui/dialog';
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

	let uploading = $state(false);
	let selectedImageForModal = $state<string | null>(null);
	$inspect(uploading);

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

{#if images.length > 0}
	<div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
		{#each images as image (image.id)}
			<div class="group relative">
				<Dialog>
					<DialogTrigger>
						<div
							class="aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition-transform hover:scale-105"
						>
							<img
								src={image.preview}
								alt=""
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
					</DialogTrigger>
					<DialogContent class="max-w-4xl">
						<img src={image.preview} alt="" class="max-h-[80vh] w-full object-contain" />
					</DialogContent>
				</Dialog>

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
			</div>
		{/each}
	</div>
{/if}

<div
	role="button"
	tabindex="0"
	aria-label="Upload images by drag and drop or click to browse"
	class="cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors {isDragOver
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
		<Upload class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
		<p class="mb-2 text-sm text-muted-foreground">
			Drag and drop images here, or
			<Button variant="link" class="h-auto p-0 text-sm" onclick={() => fileInput?.click()}>
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
