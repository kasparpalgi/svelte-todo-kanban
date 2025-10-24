<!-- @file src/lib/components/settings/GoogleCalendarIntegration.svelte -->
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
	import { CircleCheckBig, CircleAlert, Calendar } from 'lucide-svelte';
	import googleIconUrl from '$lib/assets/google.svg';

	let statusMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);
	let isConnecting = $state(false);

	const user = $derived(userStore.user);
	const hasCalendarConnected = $derived(!!user?.settings?.tokens?.google_calendar?.encrypted);
	const calendarEmail = $derived(user?.settings?.tokens?.google_calendar?.email);

	onMount(() => {
		const connected = page.url.searchParams.get('connected');
		const error = page.url.searchParams.get('error');

		if (connected === 'google-calendar') {
			statusMessage = { text: 'Google Calendar connected successfully!', type: 'success' };
			setTimeout(() => (statusMessage = null), 5000);

			// Reload user data to reflect changes
			if (user?.id) {
				userStore.initializeUser(user);
			}
		} else if (error) {
			statusMessage = { text: decodeURIComponent(error), type: 'error' };
		}
	});

	function connectCalendar() {
		if (!user?.id) {
			statusMessage = { text: 'Please log in first', type: 'error' };
			return;
		}

		isConnecting = true;
		window.location.href = `/api/google-calendar?userId=${user.id}`;
	}

	async function disconnectCalendar() {
		if (!user?.id) return;

		const confirmed = confirm(
			'Are you sure you want to disconnect Google Calendar? This will remove access to your calendar.'
		);
		if (!confirmed) return;

		const currentSettings = user.settings || {};
		const { google_calendar, ...otherTokens } = currentSettings.tokens || {};

		const result = await userStore.updateUser(user.id, {
			settings: {
				...currentSettings,
				tokens: otherTokens
			}
		});

		if (result.success) {
			statusMessage = { text: 'Google Calendar disconnected successfully', type: 'success' };
		} else {
			statusMessage = { text: 'Failed to disconnect Google Calendar', type: 'error' };
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Calendar class="h-5 w-5" />
			Google Calendar Integration
		</CardTitle>
		<CardDescription>
			Connect your Google Calendar to automatically add tasks with due dates to your calendar
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

		{#if hasCalendarConnected}
			<div class="space-y-4">
				<div class="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
					>
						<CircleCheckBig class="h-5 w-5 text-green-600 dark:text-green-400" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium">Connected to Google Calendar</p>
						<p class="text-sm text-muted-foreground">
							Authenticated as <strong class="text-foreground">{calendarEmail}</strong>
						</p>
					</div>
				</div>

				<div class="flex gap-2">
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onclick={disconnectCalendar}
						disabled={userStore.loading}
					>
						Disconnect Calendar
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onclick={connectCalendar}
						disabled={userStore.loading || isConnecting}
					>
						Reconnect
					</Button>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="rounded-lg border bg-muted/30 p-4">
					<p class="mb-3 text-sm text-muted-foreground">Connect your Google Calendar to:</p>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li class="flex items-start gap-2">
							<span class="text-primary">•</span>
							<span>Automatically add tasks with due dates to your calendar</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary">•</span>
							<span>Never miss a deadline with calendar reminders</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary">•</span>
							<span>Keep all your commitments in one place</span>
						</li>
					</ul>
				</div>

				<Button type="button" onclick={connectCalendar} disabled={isConnecting} class="w-full gap-2">
					<img src={googleIconUrl} class="w-4 h-4" alt="Google Calendar" />
					{isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>
