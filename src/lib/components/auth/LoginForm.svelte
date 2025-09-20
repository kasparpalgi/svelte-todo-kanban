<!-- @file src/lib/components/auth/LoginForm.svelte -->
<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Mail } from 'lucide-svelte';
	import googleIconUrl from '$lib/assets/google.svg';

	let email = $state('');
	let isLoading = $state(false);

	async function handleEmailSignIn() {
		isLoading = true;
		try {
			await signIn('nodemailer', { email, callbackUrl: '/dashboard' });
		} catch (error) {
			console.error('Sign in error:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleSignIn() {
		try {
			await signIn('google', { callbackUrl: '/dashboard' });
		} catch (error) {
			console.error('Google sign in error:', error);
		}
	}
</script>

<Card class="w-full max-w-md">
	<CardHeader>
		<CardTitle>Sign In</CardTitle>
		<CardDescription>Choose your preferred sign-in method</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<Button
			onclick={handleGoogleSignIn}
			variant="outline"
			class="flex w-full items-center justify-center gap-2"
		>
			<img
				src={googleIconUrl}
				alt="Google"
				class="h-5 w-5"
				style="filter: invert(33%) sepia(93%) saturate(7479%) hue-rotate(356deg) brightness(95%) contrast(97%);"
			/>
			<span class="font-medium">Continue with Google</span>
		</Button>

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground">Or</span>
			</div>
		</div>

		<!-- Email Sign In -->
		<form onsubmit={handleEmailSignIn} class="space-y-4">
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" placeholder="Enter your email" bind:value={email} required />
			</div>
			<Button type="submit" class="w-full" disabled={isLoading}>
				<Mail class="mr-2 h-4 w-4" />
				{#if isLoading}
					Sending magic link...
				{:else}
					Sign in with Email
				{/if}
			</Button>
		</form>
	</CardContent>
</Card>
