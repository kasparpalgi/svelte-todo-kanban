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
	import { signupSchema, loginSchema } from '$lib/schemas/auth';

	type Mode = 'login' | 'signup' | 'magic-link';

	let mode = $state<Mode>('login');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let name = $state('');
	let isLoading = $state(false);
	let errors = $state<Record<string, string>>({});

	async function handleMagicLinkSignIn() {
		isLoading = true;
		errors = {};
		try {
			await signIn('nodemailer', { email, callbackUrl: '/et' });
		} catch (error) {
			console.error('Sign in error:', error);
			errors.general = 'Failed to send magic link';
		} finally {
			isLoading = false;
		}
	}

	async function handlePasswordSignIn() {
		isLoading = true;
		errors = {};

		try {
			if (mode === 'signup') {
				// Validate signup data
				const result = signupSchema.safeParse({ email, password, confirmPassword, name });

				if (!result.success) {
					const fieldErrors: Record<string, string> = {};
					result.error.issues.forEach((issue) => {
						const path = issue.path[0] as string;
						fieldErrors[path] = issue.message;
					});
					errors = fieldErrors;
					return;
				}

				// Sign up
				await signIn('credentials', {
					email,
					password,
					name,
					mode: 'signup',
					callbackUrl: '/et'
				});
			} else {
				// Validate login data
				const result = loginSchema.safeParse({ email, password });

				if (!result.success) {
					const fieldErrors: Record<string, string> = {};
					result.error.issues.forEach((issue) => {
						const path = issue.path[0] as string;
						fieldErrors[path] = issue.message;
					});
					errors = fieldErrors;
					return;
				}

				// Login
				await signIn('credentials', {
					email,
					password,
					mode: 'login',
					callbackUrl: '/et'
				});
			}
		} catch (error) {
			console.error('Auth error:', error);
			errors.general = mode === 'signup' ? 'Failed to create account' : 'Invalid email or password';
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

	function switchMode(newMode: Mode) {
		mode = newMode;
		errors = {};
		password = '';
		confirmPassword = '';
		if (newMode !== 'signup') {
			name = '';
		}
	}
</script>

<Card class="w-full max-w-md">
	<CardHeader>
		<div class="flex items-center justify-between">
			<div>
				<CardTitle>
					{#if mode === 'signup'}
						{$t('auth.sign_up_title')}
					{:else}
						{$t('auth.sign_in_title')}
					{/if}
				</CardTitle>
				<CardDescription>
					{#if mode === 'signup'}
						{$t('auth.sign_up_description')}
					{:else}
						{$t('auth.sign_in_description')}
					{/if}
				</CardDescription>
			</div>
			<LanguageSwitcher />
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<!-- Google Sign In -->
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

		<!-- Email/Password Sign In/Up -->
		{#if mode === 'magic-link'}
			<form onsubmit={handleMagicLinkSignIn} class="space-y-4">
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
		{:else}
			<form onsubmit={handlePasswordSignIn} class="space-y-4">
				{#if mode === 'signup'}
					<div class="space-y-2">
						<Label for="name">{$t('auth.name')}</Label>
						<Input
							id="name"
							type="text"
							placeholder={$t('auth.enter_name')}
							bind:value={name}
							required
						/>
						{#if errors.name}
							<p class="text-sm text-destructive">{errors.name}</p>
						{/if}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="email">{$t('auth.email')}</Label>
					<Input
						id="email"
						type="email"
						placeholder={$t('auth.enter_email')}
						bind:value={email}
						required
					/>
					{#if errors.email}
						<p class="text-sm text-destructive">{errors.email}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="password">{$t('auth.password')}</Label>
					<Input
						id="password"
						type="password"
						placeholder={$t('auth.enter_password')}
						bind:value={password}
						required
					/>
					{#if errors.password}
						<p class="text-sm text-destructive">{errors.password}</p>
					{/if}
					{#if mode === 'signup'}
						<p class="text-xs text-muted-foreground">{$t('auth.password_requirements')}</p>
					{/if}
				</div>

				{#if mode === 'signup'}
					<div class="space-y-2">
						<Label for="confirmPassword">{$t('auth.confirm_password')}</Label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder={$t('auth.enter_confirm_password')}
							bind:value={confirmPassword}
							required
						/>
						{#if errors.confirmPassword}
							<p class="text-sm text-destructive">{errors.confirmPassword}</p>
						{/if}
					</div>
				{/if}

				{#if errors.general}
					<p class="text-sm text-destructive">{errors.general}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={isLoading}>
					{#if mode === 'signup'}
						{$t('auth.sign_up_with_password')}
					{:else}
						{$t('auth.sign_in_with_password')}
					{/if}
				</Button>
			</form>
		{/if}

		<!-- Mode switcher -->
		<div class="text-center text-sm">
			{#if mode === 'signup'}
				<span class="text-muted-foreground">{$t('auth.already_have_account')}</span>
				<Button variant="link" class="p-0 pl-1" onclick={() => switchMode('login')}>
					{$t('auth.switch_to_login')}
				</Button>
			{:else if mode === 'login'}
				<span class="text-muted-foreground">{$t('auth.dont_have_account')}</span>
				<Button variant="link" class="p-0 pl-1" onclick={() => switchMode('signup')}>
					{$t('auth.switch_to_signup')}
				</Button>
			{/if}
		</div>

		<!-- Magic link option -->
		{#if mode !== 'magic-link'}
			<div class="text-center text-sm">
				<Button variant="link" class="text-xs" onclick={() => switchMode('magic-link')}>
					{$t('auth.use_magic_link_instead')}
				</Button>
			</div>
		{:else}
			<div class="text-center text-sm">
				<Button variant="link" class="text-xs" onclick={() => switchMode('login')}>
					{$t('auth.use_password_instead')}
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>
