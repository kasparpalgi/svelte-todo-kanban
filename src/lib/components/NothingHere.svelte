<script>
	import { goto } from '$app/navigation';
	import { Button } from './ui/button';
	import { ArrowDownRightIcon, ArrowRight } from 'lucide-svelte';
	import nothing from '$lib/assets/nothing.avif';

	let { text = 'With such search/filters we have nothing here 🤪' } = $props();
</script>

<div class="pb-12 text-center">
	<img class="mx-auto my-12" src={nothing} alt="Try something different" />
	<p class="text-4xl">{text}</p>
	<Button onclick={() => goto('/en')} class="my-6">Try to go here<ArrowRight /></Button>
	<p class="text-xs">
		(if this also doesn't work then the whole app is SO broken that the all the developers around
		the world will be laughing)
	</p>
</div>
