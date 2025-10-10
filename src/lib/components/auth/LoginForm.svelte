<!-- @file src/lib/components/auth/LoginForm.svelte -->
<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { t } from '$lib/i18n';
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
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import googleIconUrl from '$lib/assets/google.svg';

	let email = $state('');
	let isLoading = $state(false);

	async function handleEmailSignIn() {
		isLoading = true;
		try {
			await signIn('nodemailer', { email, callbackUrl: '/et' });
		} catch (error) {
			console.error('Sign in error:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleSignIn() {
		try {
			await signIn('google', { callbackUrl: '/et' });
		} catch (error) {
			console.error('Google sign in error:', error);
		}
	}
</script>

<Card class="w-full max-w-md">
	<CardHeader>
		<div class="flex items-center justify-between">
			<div>
				<CardTitle>{$t('auth.sign_in_title')}</CardTitle>
				<CardDescription>{$t('auth.sign_in_description')}</CardDescription>
			</div>
			<LanguageSwitcher />
		</div>
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
			<span class="font-medium">{$t('auth.continue_with_google')}</span>
		</Button>

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="bg-background px-2 text-muted-foreground">{$t('auth.or')}</span>
			</div>
		</div>

		<!-- Email Sign In -->
		<form onsubmit={handleEmailSignIn} class="space-y-4">
			<div class="space-y-2">
				<Label for="email">{$t('auth.email')}</Label>
				<Input
					id="email"
					type="email"
					placeholder={$t('auth.enter_email')}
					bind:value={email}
					required
				/>
			</div>
			<Button type="submit" class="w-full" disabled={isLoading}>
				<Mail class="mr-2 h-4 w-4" />
				{#if isLoading}
					{$t('auth.sending_magic_link')}
				{:else}
					{$t('auth.sign_in_with_email')}
				{/if}
			</Button>
		</form>
	</CardContent>
</Card>
