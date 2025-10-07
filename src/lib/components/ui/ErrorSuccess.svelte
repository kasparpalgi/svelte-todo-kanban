<!-- src/lib/components/ui/ErrorSuccess.svelte -->
<script lang="ts">
	import { errorSuccessMessage } from '$lib/stores/errorSuccess.svelte';
	import { fly } from 'svelte/transition';
	import { X, CircleCheckBig, ShieldAlert } from 'lucide-svelte';

	let { classes = '' } = $props();

	function dismissMessage() {
		errorSuccessMessage.text = '';
	}

	$effect(() => {
		if (errorSuccessMessage.text && errorSuccessMessage.type === 'success') {
			const timer = setTimeout(() => {
				dismissMessage();
			}, 3000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if errorSuccessMessage.text}
	<div class="fixed right-6 bottom-6 z-[9999] {classes}" transition:fly={{ x: 300, duration: 300 }}>
		<div
			class={`flex max-w-lg min-w-96 items-start gap-4 rounded-xl border p-5 shadow-2xl backdrop-blur-md
        ${
					errorSuccessMessage.type === 'success'
						? 'border-green-200 bg-green-50/95 text-green-800'
						: 'border-red-200 bg-red-50/95 text-red-800'
				}`}
		>
			<div class="flex-shrink-0">
				{#if errorSuccessMessage.type === 'success'}
					<CircleCheckBig size="28" class="text-green-600" />
				{:else}
					<ShieldAlert size="28" class="text-red-600" />
				{/if}
			</div>

			<div class="flex-1">
				<div class="text-base leading-6 font-semibold">
					{errorSuccessMessage.text}
				</div>
			</div>

			<button
				type="button"
				class="flex-shrink-0 rounded p-1.5 transition-colors hover:bg-black/10"
				onclick={dismissMessage}
			>
				<X size="20" />
			</button>
		</div>
	</div>
{/if}
