<!-- @file src/routes/[lang]/shortener/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { urlShortcutsStore } from '$lib/stores/urlShortcuts.svelte';
	import {
		generateRandomAlias,
		normalizeTargetUrl,
		validateAlias
	} from '$lib/utils/shortcutAlias';
	import { Copy, Link2, Shuffle, Trash2 } from 'lucide-svelte';

	let aliasInput = $state('');
	let targetInput = $state('');
	let creating = $state(false);
	let confirmOpen = $state(false);
	let pendingDeleteId = $state<string | null>(null);
	let baseUrl = $state('');

	onMount(() => {
		baseUrl =
			typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
		urlShortcutsStore.loadShortcuts();
	});

	function previewUrl(alias: string): string {
		return `${baseUrl}/${alias}`;
	}

	function aliasErrorMessage(error: string): string {
		switch (error) {
			case 'reserved':
				return $t('shortener.errorReserved');
			case 'invalid_chars':
				return $t('shortener.errorInvalidChars');
			case 'empty':
				return $t('shortener.errorEmpty');
			default:
				return error;
		}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (creating) return;

		const target = targetInput.trim();
		if (!target) {
			displayMessage($t('shortener.errorTargetRequired'));
			return;
		}

		let alias = aliasInput.trim();
		if (!alias) alias = generateRandomAlias();

		const validation = validateAlias(alias);
		if (!validation.ok) {
			displayMessage(aliasErrorMessage(validation.error));
			return;
		}

		creating = true;
		try {
			const result = await urlShortcutsStore.createShortcut(alias, normalizeTargetUrl(target));
			if (result.success) {
				displayMessage($t('shortener.createdSuccess'), 1500, true);
				aliasInput = '';
				targetInput = '';
			} else {
				displayMessage(result.message);
			}
		} finally {
			creating = false;
		}
	}

	function handleRandomize() {
		aliasInput = generateRandomAlias();
	}

	function handleDelete(id: string) {
		pendingDeleteId = id;
		confirmOpen = true;
	}

	async function confirmDelete() {
		if (!pendingDeleteId) return;
		const result = await urlShortcutsStore.deleteShortcut(pendingDeleteId);
		pendingDeleteId = null;
		if (result.success) {
			displayMessage($t('shortener.deletedSuccess'), 1500, true);
		} else {
			displayMessage(result.message);
		}
	}

	async function handleCopy(alias: string) {
		const url = previewUrl(alias);
		try {
			await navigator.clipboard.writeText(url);
			displayMessage($t('shortener.copied'), 1200, true);
		} catch {
			displayMessage(url, 4000);
		}
	}
</script>

<svelte:head>
	<title>{$t('shortener.title')} | ToDzz</title>
</svelte:head>

<section class="mx-auto w-full max-w-3xl py-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">{$t('shortener.title')}</h1>
		<p class="mt-1 text-sm text-muted-foreground">{$t('shortener.description')}</p>
	</header>

	<form
		onsubmit={handleCreate}
		class="mb-8 grid gap-4 rounded-lg border bg-card p-4 shadow-sm sm:grid-cols-[1fr_2fr_auto] sm:items-end"
	>
		<div class="space-y-1">
			<Label for="alias-input">{$t('shortener.aliasLabel')}</Label>
			<div class="flex gap-2">
				<Input
					id="alias-input"
					bind:value={aliasInput}
					placeholder={$t('shortener.aliasPlaceholder')}
					autocomplete="off"
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					onclick={handleRandomize}
					title={$t('shortener.randomizeButton')}
				>
					<Shuffle class="h-4 w-4" />
				</Button>
			</div>
		</div>
		<div class="space-y-1">
			<Label for="target-input">{$t('shortener.targetLabel')}</Label>
			<Input
				id="target-input"
				type="url"
				bind:value={targetInput}
				placeholder={$t('shortener.targetPlaceholder')}
				autocomplete="off"
				required
			/>
		</div>
		<Button type="submit" disabled={creating}>
			{creating ? $t('shortener.creating') : $t('shortener.createButton')}
		</Button>
	</form>

	{#if urlShortcutsStore.loading && urlShortcutsStore.items.length === 0}
		<p class="text-center text-sm text-muted-foreground">{$t('common.saving')}</p>
	{:else if urlShortcutsStore.error}
		<p class="text-center text-sm text-destructive">{urlShortcutsStore.error}</p>
	{:else if urlShortcutsStore.items.length === 0}
		<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
			<Link2 class="mx-auto mb-2 h-8 w-8 opacity-50" />
			<p>{$t('shortener.emptyState')}</p>
		</div>
	{:else}
		<ul class="space-y-3">
			{#each urlShortcutsStore.items as shortcut (shortcut.id)}
				<li
					class="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex items-center gap-2">
							<a
								href={previewUrl(shortcut.alias)}
								target="_blank"
								rel="noopener noreferrer"
								class="truncate font-mono text-sm font-semibold text-primary hover:underline"
							>
								{previewUrl(shortcut.alias)}
							</a>
							<button
								type="button"
								onclick={() => handleCopy(shortcut.alias)}
								class="text-muted-foreground transition-colors hover:text-foreground"
								title={$t('shortener.copyLink')}
								aria-label={$t('shortener.copyLink')}
							>
								<Copy class="h-3.5 w-3.5" />
							</button>
						</div>
						<a
							href={shortcut.target_url}
							target="_blank"
							rel="noopener noreferrer"
							class="block truncate text-xs text-muted-foreground hover:underline"
						>
							→ {shortcut.target_url}
						</a>
						<div class="text-xs text-muted-foreground">
							{shortcut.visit_count}
							{$t('shortener.visits')} ·
							{new Date(shortcut.created_at).toLocaleDateString()}
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onclick={() => handleDelete(shortcut.id)}
						aria-label={$t('common.delete')}
					>
						<Trash2 class="h-4 w-4 text-destructive" />
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<ConfirmDialog
	bind:open={confirmOpen}
	title={$t('shortener.deleteConfirmTitle')}
	description={$t('shortener.deleteConfirm')}
	confirmText={$t('common.delete')}
	cancelText={$t('common.cancel')}
	variant="destructive"
	icon="delete"
	onConfirm={confirmDelete}
	onCancel={() => (pendingDeleteId = null)}
/>
