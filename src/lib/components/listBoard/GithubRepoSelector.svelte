<!-- @file src/lib/components/listBoard/GithubRepoSelector.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Search, Loader } from 'lucide-svelte';
	import githubLogo from '$lib/assets/github.svg';
	import type { GithubRepoSelectorProps } from '$lib/types/listBoard';
	import WebhookManager from '$lib/components/github/WebhookManager.svelte';

	let { open = $bindable(), currentRepo, onSelect, boardId }: GithubRepoSelectorProps & { boardId?: string } = $props();

	let repos = $state<Array<{ full_name: string; description: string | null }>>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	const filteredRepos = $derived(
		repos.filter((repo) => repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	onMount(async () => {
		await fetchRepos();
	});

	async function fetchRepos() {
		const userId = userStore.user?.id;
		if (!userId) {
			error = $t('github.please_login_first');
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/github/repos?userId=${userId}`);

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ message: $t('github.no_repositories_found') }));
				throw new Error(errorData.message || $t('github.no_repositories_found'));
			}

			repos = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : $t('github.no_repositories_found');
			console.error('Error fetching repos:', err);
		} finally {
			loading = false;
		}
	}

	function handleSelect(repoFullName: string) {
		onSelect(repoFullName);
	}

	function handleDisconnect() {
		onSelect(null);
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-h-[600px] sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<img src={githubLogo} alt="GitHub" class="h-6 w-6" />
				{$t('github.select_repository')}
			</DialogTitle>
			<DialogDescription>{$t('github.choose_repo_description')}</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			{#if currentRepo}
				<div class="rounded-lg border bg-muted/50 p-3">
					<p class="text-sm text-muted-foreground">{$t('github.currently_connected')}</p>
					<p class="font-medium">{currentRepo}</p>
				</div>

				{#if boardId && currentRepo.includes('/')}
					{@const [owner, repo] = currentRepo.split('/')}
					<WebhookManager {owner} {repo} {boardId} />
				{/if}
			{/if}

			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input bind:value={searchQuery} placeholder={$t('github.search_repositories')} class="pl-9" />
			</div>

			<div class="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-2">
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<Loader class="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				{:else if error}
					<div class="py-8 text-center">
						<p class="text-sm text-red-600">{error}</p>
						<Button variant="outline" size="sm" onclick={fetchRepos} class="mt-2">{$t('github.retry')}</Button>
					</div>
				{:else if filteredRepos.length === 0}
					<div class="py-8 text-center text-sm text-muted-foreground">
						{searchQuery ? $t('github.no_repositories_found') : $t('github.no_repositories_available')}
					</div>
				{:else}
					{#each filteredRepos as repo (repo.full_name)}
						<button
							onclick={() => handleSelect(repo.full_name)}
							class="w-full rounded p-2 text-left transition-colors hover:bg-muted {currentRepo ===
							repo.full_name
								? 'bg-primary/10'
								: ''}"
						>
							<p class="font-medium">{repo.full_name}</p>
							{#if repo.description}
								<p class="text-xs text-muted-foreground">{repo.description}</p>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<DialogFooter class="gap-2">
			{#if currentRepo}
				<Button variant="outline" onclick={handleDisconnect}>{$t('github.disconnect')}</Button>
			{/if}
			<Button variant="outline" onclick={() => (open = false)}>{$t('common.cancel')}</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
