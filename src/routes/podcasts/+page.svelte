<!-- @file src/routes/podcasts/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { t, initTranslations } from '$lib/i18n';
	import { DEFAULT_LOCALE } from '$lib/constants/locale';
	import { podcastsStore } from '$lib/stores/podcasts.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Mic, Plus, Download, Eye, ExternalLink, Settings, AlertCircle } from 'lucide-svelte';
	import { marked } from 'marked';

	let { data } = $props();

	const session = $derived(data?.session);
	const isAuthenticated = $derived(!!session?.user);
	const user = $derived(userStore.user);
	const groqApiKey = $derived(user?.settings?.tokens?.groq?.api_key as string | undefined);

	let showForm = $state(false);
	let selectedPodcast = $state<(typeof podcastsStore.podcasts)[number] | null>(null);
	let guestGroqKey = $state('');
	let isSaving = $state(false);

	let form = $state({
		podcast_name: '',
		url: '',
		title: '',
		description: '',
		date: new Date().toISOString().split('T')[0]
	});

	$effect(() => {
		if (session?.user) {
			userStore.initializeUser(session.user);
		}
	});

	onMount(async () => {
		// Initialize translations for this non-[lang] route
		const locale = (session?.user as any)?.locale || DEFAULT_LOCALE;
		await initTranslations(locale);
		await podcastsStore.loadPodcasts();
	});

	function resetForm() {
		form = {
			podcast_name: '',
			url: '',
			title: '',
			description: '',
			date: new Date().toISOString().split('T')[0]
		};
		guestGroqKey = '';
	}

	function getEffectiveGroqKey(): string {
		return groqApiKey || guestGroqKey;
	}

	async function handleSaveAndTranscribe() {
		if (!form.podcast_name.trim()) {
			displayMessage($t('podcasts.name_required'), 3000, false);
			return;
		}
		if (!form.url.trim()) {
			displayMessage($t('podcasts.url_required'), 3000, false);
			return;
		}
		const apiKey = getEffectiveGroqKey();
		if (!apiKey) {
			displayMessage($t('podcasts.groq_key_required'), 3000, false);
			return;
		}

		isSaving = true;
		const insertResult = await podcastsStore.insertPodcast(
			{
				podcast_name: form.podcast_name.trim(),
				url: form.url.trim(),
				title: form.title.trim() || undefined,
				description: form.description.trim() || undefined,
				date: form.date || undefined,
				transcription_md: ''
			},
			isAuthenticated
		);

		if (!insertResult.success) {
			isSaving = false;
			displayMessage($t('podcasts.add_failed'), 3000, false);
			return;
		}

		displayMessage($t('podcasts.added_success'), 3000, true);
		showForm = false;
		resetForm();
		isSaving = false;

		const podcast = insertResult.data as (typeof podcastsStore.podcasts)[number];
		const transcribeResult = await podcastsStore.transcribeAndSave(
			podcast.id,
			podcast.url,
			apiKey
		);

		if (transcribeResult.success) {
			displayMessage($t('podcasts.transcribe_success'), 3000, true);
		} else {
			displayMessage(
				`${$t('podcasts.transcribe_failed')}: ${transcribeResult.message}`,
				5000,
				false
			);
		}
	}

	async function handleSaveOnly() {
		if (!form.podcast_name.trim()) {
			displayMessage($t('podcasts.name_required'), 3000, false);
			return;
		}
		if (!form.url.trim()) {
			displayMessage($t('podcasts.url_required'), 3000, false);
			return;
		}

		isSaving = true;
		const insertResult = await podcastsStore.insertPodcast(
			{
				podcast_name: form.podcast_name.trim(),
				url: form.url.trim(),
				title: form.title.trim() || undefined,
				description: form.description.trim() || undefined,
				date: form.date || undefined,
				transcription_md: ''
			},
			isAuthenticated
		);
		isSaving = false;

		if (!insertResult.success) {
			displayMessage($t('podcasts.add_failed'), 3000, false);
			return;
		}

		displayMessage($t('podcasts.added_success'), 3000, true);
		showForm = false;
		resetForm();
	}

	function downloadMarkdown(podcast: (typeof podcastsStore.podcasts)[number]) {
		if (!browser || !podcast.transcription_md) return;
		const safeName = (podcast.title || podcast.podcast_name)
			.replace(/[^a-z0-9]/gi, '_')
			.toLowerCase();
		const blob = new Blob([podcast.transcription_md], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${safeName}.md`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function renderMarkdown(md: string): string {
		try {
			return marked.parse(md) as string;
		} catch {
			return md;
		}
	}

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return dateStr;
		}
	}
</script>

<svelte:head>
	<title>{$t('podcasts.title')} — ToDzz</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Mic class="h-7 w-7 text-primary" />
			<h1 class="text-2xl font-bold">{$t('podcasts.title')}</h1>
		</div>
		<Button
			onclick={() => {
				showForm = true;
				resetForm();
			}}
			class="flex items-center gap-2"
		>
			<Plus class="h-4 w-4" />
			{$t('podcasts.add_transcribe')}
		</Button>
	</div>

	<!-- Add form dialog -->
	<Dialog bind:open={showForm}>
		<DialogContent class="max-w-lg">
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2">
					<Mic class="h-5 w-5" />
					{$t('podcasts.add_transcribe')}
				</DialogTitle>
			</DialogHeader>

			<div class="space-y-4">
				<div class="space-y-1.5">
					<Label for="podcast-name">{$t('podcasts.podcast_name')} *</Label>
					<Input
						id="podcast-name"
						bind:value={form.podcast_name}
						placeholder={$t('podcasts.podcast_name_placeholder')}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="audio-url">{$t('podcasts.audio_url')} *</Label>
					<Input
						id="audio-url"
						type="url"
						bind:value={form.url}
						placeholder={$t('podcasts.audio_url_placeholder')}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="episode-title">{$t('podcasts.episode_title')}</Label>
					<Input
						id="episode-title"
						bind:value={form.title}
						placeholder={$t('podcasts.episode_title_placeholder')}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="episode-date">{$t('podcasts.date')}</Label>
					<Input id="episode-date" type="date" bind:value={form.date} />
				</div>

				<div class="space-y-1.5">
					<Label for="episode-desc">{$t('podcasts.description')}</Label>
					<Textarea
						id="episode-desc"
						bind:value={form.description}
						placeholder={$t('podcasts.description_placeholder')}
						rows={3}
					/>
				</div>

				<!-- Groq API key handling -->
				{#if isAuthenticated}
					{#if !groqApiKey}
						<div
							class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
						>
							<p class="mb-2">{$t('podcasts.groq_key_missing')}</p>
							<Button
								variant="outline"
								size="sm"
								onclick={() => goto('/en/settings')}
								class="flex items-center gap-1"
							>
								<Settings class="h-3.5 w-3.5" />
								{$t('podcasts.go_to_settings')}
							</Button>
						</div>
					{/if}
				{:else}
					<div class="space-y-1.5">
						<Label for="groq-key">{$t('podcasts.groq_api_key')}</Label>
						<Input
							id="groq-key"
							type="password"
							bind:value={guestGroqKey}
							placeholder={$t('podcasts.groq_api_key_placeholder')}
						/>
					</div>
				{/if}

				<div class="flex gap-2 pt-1">
					<Button
						variant="outline"
						onclick={() => {
							showForm = false;
							resetForm();
						}}
						class="flex-1"
					>
						{$t('podcasts.cancel')}
					</Button>
					<Button
						variant="outline"
						onclick={handleSaveOnly}
						disabled={isSaving}
						class="flex-1"
					>
						{isSaving ? $t('podcasts.saving') : $t('podcasts.save')}
					</Button>
					<Button
						onclick={handleSaveAndTranscribe}
						disabled={isSaving ||
							podcastsStore.transcribing ||
							(isAuthenticated ? !groqApiKey : !guestGroqKey)}
						class="flex-1"
					>
						{podcastsStore.transcribing ? $t('podcasts.transcribing') : $t('podcasts.transcribe')}
					</Button>
				</div>
			</div>
		</DialogContent>
	</Dialog>

	<!-- Transcription viewer dialog -->
	{#if selectedPodcast}
		<Dialog
			open={!!selectedPodcast}
			onOpenChange={(open) => {
				if (!open) selectedPodcast = null;
			}}
		>
			<DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle class="flex items-center justify-between gap-2 pr-6">
						<span>{selectedPodcast.title || selectedPodcast.podcast_name}</span>
						{#if selectedPodcast.transcription_md}
							<Button
								variant="outline"
								size="sm"
								onclick={() => downloadMarkdown(selectedPodcast!)}
								class="flex items-center gap-1"
							>
								<Download class="h-3.5 w-3.5" />
								{$t('podcasts.download_md')}
							</Button>
						{/if}
					</DialogTitle>
				</DialogHeader>

				<div class="mt-2">
					{#if selectedPodcast.transcription_md}
						<div class="prose prose-sm dark:prose-invert max-w-none">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderMarkdown(selectedPodcast.transcription_md)}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">{$t('podcasts.no_transcription')}</p>
					{/if}
				</div>
			</DialogContent>
		</Dialog>
	{/if}

	<!-- Error state -->
	{#if podcastsStore.error && !podcastsStore.loading}
		<div
			class="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
		>
			<AlertCircle class="h-4 w-4 shrink-0" />
			<span>{podcastsStore.error}</span>
			<Button variant="ghost" size="sm" onclick={() => podcastsStore.loadPodcasts()} class="ml-auto">
				Retry
			</Button>
		</div>
	{/if}

	<!-- Podcast list -->
	{#if podcastsStore.loading}
		<div class="py-12 text-center text-sm text-muted-foreground">Loading...</div>
	{:else if podcastsStore.podcasts.length === 0 && !podcastsStore.error}
		<div
			class="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground"
			data-testid="no-podcasts-message"
		>
			{$t('podcasts.no_podcasts')}
		</div>
	{:else}
		<div class="space-y-4" data-testid="podcasts-list">
			{#each podcastsStore.podcasts as podcast (podcast.id)}
				<Card data-testid="podcast-card">
					<CardHeader class="pb-2">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<div class="mb-1 flex flex-wrap items-center gap-2">
									<Badge variant="secondary" class="shrink-0 text-xs">
										{podcast.podcast_name}
									</Badge>
									{#if podcast.date}
										<span class="text-xs text-muted-foreground">{formatDate(podcast.date)}</span>
									{/if}
								</div>
								<CardTitle class="text-base leading-snug">
									{podcast.title || podcast.podcast_name}
								</CardTitle>
								{#if podcast.description}
									<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
										{podcast.description}
									</p>
								{/if}
							</div>
							<div class="flex shrink-0 gap-1">
								<a
									href={podcast.url}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									title="Open audio"
									data-testid="podcast-audio-link"
								>
									<ExternalLink class="h-4 w-4" />
								</a>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => (selectedPodcast = podcast)}
									class="flex items-center gap-1.5"
									data-testid="view-transcription-btn"
								>
									<Eye class="h-4 w-4" />
									{$t('podcasts.view_transcription')}
								</Button>
								{#if podcast.transcription_md}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => downloadMarkdown(podcast)}
										title={$t('podcasts.download_md')}
										data-testid="download-md-btn"
									>
										<Download class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>
					</CardHeader>
					{#if podcast.user}
						<CardContent class="pt-0">
							<p class="text-xs text-muted-foreground">
								{$t('podcasts.added_by')} @{podcast.user.username}
								· {formatDate(podcast.created_at)}
							</p>
						</CardContent>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</div>
