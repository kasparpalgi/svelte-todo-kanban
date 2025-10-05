<script>
	import { confetti } from '@neoconfetti/svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import NothingHere from '$lib/components/NothingHere.svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';

	let confet = '';
	setInterval(function () {
		confet = 'e';
	}, 10);

	onMount(() => {
		// Log the error that occurred
		const errorData = $page.error;
		const status = $page.status;
		const url = $page.url.pathname;

		console.log('[ErrorPage] Error occurred', {
			status,
			message: errorData?.message,
			url
		});

		// Log different severity based on error type
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
	<title>Ooooops... 🤪 Todzzzzz broken</title>
</svelte:head>

{#if confet}
	<div use:confetti></div>
{/if}

<NothingHere text="Just a casual 404 aka. this exact URL doesn't exist (anymore)! OR maybe we have error in this super error prone app? 🤪🤪🤪" />