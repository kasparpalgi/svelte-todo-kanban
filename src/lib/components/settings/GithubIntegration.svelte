<!-- @file src/lib/components/settings/GithubIntegration.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { CircleCheckBig, CircleAlert } from 'lucide-svelte';
	import githubLogo from '$lib/assets/github.svg';

	let statusMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);
	let isConnecting = $state(false);

	const user = $derived(userStore.user);
	const hasGithubConnected = $derived(!!user?.settings?.tokens?.github?.encrypted);
	const githubUsername = $derived(user?.settings?.tokens?.github?.username);

	onMount(() => {
		const connected = page.url.searchParams.get('connected');
		const error = page.url.searchParams.get('error');

		if (connected === 'github') {
			statusMessage = { text: 'GitHub connected successfully!', type: 'success' };
			setTimeout(() => (statusMessage = null), 5000);

			// Reload user data to reflect changes
			if (user?.id) {
				userStore.initializeUser(user);
			}
		} else if (error) {
			statusMessage = { text: decodeURIComponent(error), type: 'error' };
		}
	});

	function connectGithub() {
		if (!user?.id) {
			statusMessage = { text: 'Please log in first', type: 'error' };
			return;
		}

		isConnecting = true;
		window.location.href = `/api/Fgithub?userId=${user.id}`;
	}

	async function disconnectGithub() {
		if (!user?.id) return;

		const confirmed = confirm(
			'Are you sure you want to disconnect GitHub? This will remove access to your GitHub repos.'
		);
		if (!confirmed) return;

		const currentSettings = user.settings || {};
		const { github, ...otherTokens } = currentSettings.tokens || {};

		const result = await userStore.updateUser(user.id, {
			settings: {
				...currentSettings,
				tokens: otherTokens
			}
		});

		if (result.success) {
			statusMessage = { text: 'GitHub disconnected successfully', type: 'success' };
		} else {
			statusMessage = { text: 'Failed to disconnect GitHub', type: 'error' };
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<img src={githubLogo} alt="GitHub" />
			GitHub Integration
		</CardTitle>
		<CardDescription>
			Connect your GitHub account to sync issues and manage them as todos
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if statusMessage}
			<div
				class="flex items-center gap-2 rounded-lg border p-3 {statusMessage.type === 'success'
					? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
					: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'}"
			>
				{#if statusMessage.type === 'success'}
					<CircleCheckBig class="h-4 w-4" />
				{:else}
					<CircleAlert class="h-4 w-4" />
				{/if}
				<span class="text-sm">{statusMessage.text}</span>
			</div>
		{/if}

		{#if hasGithubConnected}
			<div class="space-y-4">
				<div class="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
					>
						<CircleCheckBig class="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium">Connected to GitHub</p>
						<p class="text-sm text-muted-foreground">
							Authenticated as <strong class="text-foreground">{githubUsername}</strong>
						</p>
					</div>
				</div>

				<div class="flex gap-2">
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onclick={disconnectGithub}
						disabled={userStore.loading}
					>
						Disconnect GitHub
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={connectGithub}
						disabled={userStore.loading || isConnecting}
					>
						Reconnect
					</Button>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="rounded-lg border bg-muted/30 p-4">
					<p class="mb-3 text-sm text-muted-foreground">Connect your GitHub account to:</p>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li class="flex items-start gap-2">
							<span class="text-primary">•</span>
							<span>Import and sync GitHub issues</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary">•</span>
							<span>Manage issues directly from your todo app</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary">•</span>
							<span>Keep track of pull requests and code reviews</span>
						</li>
					</ul>
				</div>

				<Button type="button" onclick={connectGithub} disabled={isConnecting} class="w-full gap-2">
					<img src={githubLogo} alt="GitHub" />
					{isConnecting ? 'Connecting...' : 'Connect GitHub Account'}
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>
