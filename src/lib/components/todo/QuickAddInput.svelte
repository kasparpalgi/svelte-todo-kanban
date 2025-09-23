<!-- @file src/lib/components/todo/QuickAddInput.svelte -->
<script lang="ts">
	let {
		value = $bindable(''),
		autofocus = false,
		onSubmit = (val: string) => {},
		onCancel = () => {},
		id = `quickadd-${crypto.randomUUID()}` // Generate unique ID
	} = $props();

	let inputEl: HTMLInputElement;
	let mounted = false;

	$effect(() => {
		mounted = true;
		return () => {
			mounted = false;
		};
	});

	$effect(() => {
		if (autofocus && inputEl && mounted) {
			requestAnimationFrame(() => {
				inputEl?.focus?.();
			});
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			onSubmit(value.trim());
		} else if (event.key === 'Escape') {
			onCancel();
		}
	}

	function handleSubmit() {
		onSubmit(value.trim());
	}
</script>

<div class="space-y-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-2">
	<input
		bind:this={inputEl}
		bind:value
		onkeydown={handleKeydown}
		placeholder="Enter task title..."
		class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		{id}
	/>
</div>
