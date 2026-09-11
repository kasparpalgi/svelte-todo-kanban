<!-- @file src/lib/components/settings/AdminNewsPanel.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Megaphone } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	let title = $state('');
	let body = $state('');
	let url = $state('');
	let sending = $state(false);

	async function handleSend() {
		if (!title.trim() || !body.trim()) return;
		sending = true;
		try {
			const response = await fetch('/api/admin/news', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || null })
			});

			if (!response.ok) {
				throw new Error(`Request failed: ${response.status}`);
			}

			displayMessage($t('settings.news.sent'), 2000, true);
			title = '';
			body = '';
			url = '';
		} catch (e) {
			displayMessage(e instanceof Error ? e.message : $t('settings.news.send_failed'));
		} finally {
			sending = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Megaphone class="h-5 w-5" />
			{$t('settings.news.title')}
		</CardTitle>
		<CardDescription>{$t('settings.news.description')}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label for="news-title">{$t('settings.news.news_title')}</Label>
			<Input
				id="news-title"
				bind:value={title}
				placeholder={$t('settings.news.news_title_placeholder')}
			/>
		</div>
		<div class="space-y-2">
			<Label for="news-body">{$t('settings.news.body')}</Label>
			<Textarea
				id="news-body"
				bind:value={body}
				rows={4}
				placeholder={$t('settings.news.body_placeholder')}
			/>
		</div>
		<div class="space-y-2">
			<Label for="news-url">{$t('settings.news.url')}</Label>
			<Input id="news-url" type="url" bind:value={url} placeholder="https://..." />
		</div>
		<Button
			type="button"
			onclick={handleSend}
			disabled={sending || !title.trim() || !body.trim()}
			class="w-full"
		>
			{sending ? $t('settings.news.sending') : $t('settings.news.send')}
		</Button>
	</CardContent>
</Card>
