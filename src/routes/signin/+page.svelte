<!-- @file src/routes/auth/signin/+page.svelte -->
<script>
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
</script>

<svelte:head>
	<title>Sign In</title>
</svelte:head>

<div class="container flex h-screen w-screen flex-col items-center justify-center">
	<LoginForm />
</div>
