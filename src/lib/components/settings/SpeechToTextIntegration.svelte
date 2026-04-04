<!-- @file src/lib/components/settings/SpeechToTextIntegration.svelte -->
<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Mic, CircleCheckBig, CircleAlert, Eye, EyeOff } from 'lucide-svelte';

	const user = $derived(userStore.user);
	let selectedProvider = $state('browser');
	let inputGroqApiKey = $state('');
	let showApiKey = $state(false);
	let statusMessage = $state<{ text: string; type: 'success' | 'error' } | null>(null);
	let initialized = $state(false);

	$effect(() => {
		if (user && !initialized) {
			selectedProvider = user.settings?.speech_provider || 'browser';
			inputGroqApiKey = user.settings?.tokens?.groq?.api_key || '';
			initialized = true;
		}
	});

	async function saveSettings() {
		if (!user?.id) return;

		const currentSettings = user.settings || {};
		const currentTokens = (currentSettings.tokens as Record<string, unknown>) || {};

		const newTokens =
			selectedProvider === 'groq' && inputGroqApiKey
				? { ...currentTokens, groq: { api_key: inputGroqApiKey } }
				: (({ groq, ...rest }: any) => rest)(currentTokens);

		const result = await userStore.updateUser(user.id, {
			settings: {
				...currentSettings,
				speech_provider: selectedProvider,
				tokens: newTokens
			}
		});

		if (result.success) {
			statusMessage = { text: $t('settings.speech.saved'), type: 'success' };
			setTimeout(() => (statusMessage = null), 3000);
		} else {
			statusMessage = { text: $t('settings.speech.save_failed'), type: 'error' };
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Mic class="h-5 w-5" />
			{$t('settings.speech.title')}
		</CardTitle>
		<CardDescription>{$t('settings.speech.description')}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if statusMessage}
			<div
				class="flex items-center gap-2 rounded-lg border p-3 {statusMessage.type === 'success'
					? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
					: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'}"
			>
				{#if statusMessage.type === 'success'}
					<CircleCheckBig class="h-4 w-4 shrink-0" />
				{:else}
					<CircleAlert class="h-4 w-4 shrink-0" />
				{/if}
				<span class="text-sm">{statusMessage.text}</span>
			</div>
		{/if}

		<div class="space-y-2">
			<Label for="speech-provider">{$t('settings.speech.provider')}</Label>
			<select
				id="speech-provider"
				bind:value={selectedProvider}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="browser">{$t('settings.speech.provider_browser')}</option>
				<option value="groq">{$t('settings.speech.provider_groq')}</option>
				<option value="whisper">{$t('settings.speech.provider_whisper')}</option>
			</select>
			<p class="text-xs text-muted-foreground">
				{#if selectedProvider === 'browser'}
					{$t('settings.speech.browser_description')}
				{:else if selectedProvider === 'groq'}
					{$t('settings.speech.groq_description')}
				{:else}
					{$t('settings.speech.whisper_description')}
				{/if}
			</p>
		</div>

		{#if selectedProvider === 'groq'}
			<div class="space-y-2">
				<Label for="groq-api-key">{$t('settings.speech.groq_api_key')}</Label>
				<div class="relative">
					<Input
						id="groq-api-key"
						type={showApiKey ? 'text' : 'password'}
						bind:value={inputGroqApiKey}
						placeholder="gsk_..."
						class="pr-10"
					/>
					<button
						type="button"
						onclick={() => (showApiKey = !showApiKey)}
						class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						{#if showApiKey}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
				</div>
				<p class="text-xs text-muted-foreground">{$t('settings.speech.groq_api_key_hint')}</p>
			</div>
		{/if}

		<Button
			type="button"
			onclick={saveSettings}
			disabled={userStore.loading || (selectedProvider === 'groq' && !inputGroqApiKey)}
			class="w-full"
		>
			{$t('settings.speech.save')}
		</Button>
	</CardContent>
</Card>
