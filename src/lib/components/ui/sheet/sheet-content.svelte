<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import XIcon from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		side = 'right',
		showCloseButton = true,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		side?: 'right' | 'left';
		showCloseButton?: boolean;
		portalProps?: DialogPrimitive.PortalProps;
		children: Snippet;
	} = $props();

	const sideClasses =
		side === 'right'
			? 'right-0 top-0 h-full w-80 border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right'
			: 'left-0 top-0 h-full w-80 border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left';
</script>

<DialogPrimitive.Portal {...portalProps}>
	<DialogPrimitive.Overlay
		data-slot="sheet-overlay"
		class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
	/>
	<DialogPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		class={cn(
			'fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
			sideClasses,
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close
				class="ring-offset-background focus:ring-ring rounded-xs focus:outline-hidden absolute end-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2"
			>
				<XIcon class="h-4 w-4" />
				<span class="sr-only">Close</span>
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
