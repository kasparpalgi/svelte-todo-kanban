<!-- @file src/lib/components/voice/VoiceAssistant.svelte — header mic for the wake-word assistant (#237) -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Mic, MicOff } from 'lucide-svelte';
	import { t } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { voiceAssistant } from '$lib/stores/voiceAssistant.svelte';
	import { getEffectiveLocale } from '$lib/constants/locale';
	import { DEFAULT_WAKE_WORD } from '$lib/utils/voiceCommands';

	const settings = $derived(userStore.user?.settings?.voice_assistant);
	const wakeWord = $derived(settings?.wake_word?.trim() || DEFAULT_WAKE_WORD);
	const lang = $derived(getEffectiveLocale(page.params.lang, userStore.user?.locale));
	let paused = $state(false);

	// untrack: start() reads the store's own state, which must not re-run this effect.
	$effect(() => {
		const on = settings?.enabled && !paused;
		const [word, locale] = [wakeWord, lang];
		untrack(() => (on ? voiceAssistant.start(word, locale) : voiceAssistant.stop()));
	});

	$effect(() => () => voiceAssistant.stop());
</script>

{#if settings?.enabled && voiceAssistant.supported}
	<button
		type="button"
		onclick={() => (paused = !paused)}
		class="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		title={voiceAssistant.blocked
			? $t('voice_assistant.blocked')
			: voiceAssistant.listening
				? $t('voice_assistant.listening', { wakeWord })
				: $t('voice_assistant.paused')}
		aria-label={$t('voice_assistant.toggle')}
		aria-pressed={!paused}
	>
		{#if voiceAssistant.listening}
			<Mic class="h-5 w-5" />
			<span class="absolute top-1 right-1 h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
		{:else}
			<MicOff class="h-5 w-5 {voiceAssistant.blocked ? 'text-red-500' : ''}" />
		{/if}
	</button>
{/if}
