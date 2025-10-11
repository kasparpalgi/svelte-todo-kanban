<script>
	import { goto } from '$app/navigation';
	import { t, locale } from '$lib/i18n';
	import { Button } from './ui/button';
	import { ArrowRight } from 'lucide-svelte';
	import nothing from '$lib/assets/nothing.avif';

	let { text = $t('common.nothing_here') } = $props();
</script>

<div class="pb-12 text-center">
	<img class="mx-auto my-12" src={nothing} alt="Try something different" />
	<p class="text-4xl">{text}</p>
	<Button onclick={() => goto(`/${locale}`)} class="my-6"
		>{$t('common.try_this')}<ArrowRight /></Button
	>
	<p class="text-xs">
		({$t('common.error_page')})
	</p>
</div>
