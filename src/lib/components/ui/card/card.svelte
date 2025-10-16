<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { scale } from 'svelte/transition';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	in:scale
	bind:this={ref}
	data-slot="card"
	class={cn(
		'flex flex-col gap-6 rounded-xl border bg-card pt-3 pb-1 text-card-foreground shadow-sm',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
