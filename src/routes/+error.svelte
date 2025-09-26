<script>
	import { confetti } from '@neoconfetti/svelte';
	import NothingHere from '$lib/components/NothingHere.svelte';

	let confet = '';
	setInterval(function () {
		confet = 'e';
	}, 10);
</script>

<svelte:head>
	<title>Ui-oi-ai, Renlog on katki</title>
</svelte:head>

{#if confet}
	<div use:confetti></div>
{/if}

<NothingHere text="Just a casual 404 aka. this exact URL doesn't exist (anymore)!" />