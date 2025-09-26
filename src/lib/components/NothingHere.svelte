<script>
	import nothing from '$lib/assets/nothing.avif';

	let { text = 'With such search/filters we have nothing here 🤪' } = $props();
</script>

<div class="pb-12 text-center">
	<img class="mx-auto my-12" src={nothing} alt="Try something different" />
	<p>{text}</p>
</div>
