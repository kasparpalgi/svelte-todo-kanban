<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { confetti } from '@neoconfetti/svelte';
	import NothingHere from '$lib/components/NothingHere.svelte';

	let confet = '';
	setInterval(function () {
		confet = 'e';
	}, 10);

	onMount(() => {
		const errorData = page.error;
		const status = page.status;
		const url = page.url.pathname;

		if (status === 404) {
			loggingStore.warn('ErrorPage', `404 Not Found: ${url}`, {
				status,
				url,
				referrer: document.referrer || 'direct'
			});
		} else if (status >= 500) {
			loggingStore.error('ErrorPage', `Server Error ${status}: ${errorData?.message || 'Unknown'}`, {
				status,
				url,
				error: errorData,
				userAgent: navigator.userAgent
			});
		} else {
			loggingStore.error('ErrorPage', `Error ${status}: ${errorData?.message || 'Unknown'}`, {
				status,
				url,
				error: errorData
			});
		}
	});
</script>

<svelte:head>
	<title>{$t('common.error_title')}</title>
</svelte:head>

{#if confet}
	<div use:confetti></div>
{/if}

<NothingHere text={$t('common.error')} />