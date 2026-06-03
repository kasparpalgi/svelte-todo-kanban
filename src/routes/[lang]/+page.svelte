<!-- @file src/routes/[lang]/+page.svelte -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { getEffectiveLocale } from '$lib/constants/locale';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Layers } from 'lucide-svelte';

	let name = $state('');
	let creating = $state(false);

	const lang = $derived(getEffectiveLocale(page.params.lang, userStore.user?.locale));

	function boardPath(board: { user?: { username?: string | null } | null; alias?: string | null }) {
		if (board?.user?.username && board.alias) {
			return `/${lang}/${board.user.username}/${board.alias}`;
		}
		return null;
	}

	// The server only routes here when the user has no own/member board to land on.
	// Still load boards client-side so that, if one already exists (e.g. created in
	// another tab), we forward to it instead of showing the empty state.
	$effect(() => {
		if (!browser) return;
		if (!listsStore.initialized) {
			listsStore.loadBoards();
			return;
		}
		const own = listsStore.sortedBoards.find((b) => b.user?.id === userStore.user?.id);
		const target = own ?? listsStore.sortedBoards[0];
		const path = target ? boardPath(target) : null;
		if (path) goto(path);
	});

	async function handleCreate(event: SubmitEvent) {
		event.preventDefault();
		if (creating || !name.trim()) return;
		creating = true;
		try {
			const result = await listsStore.createBoard(name);
			if (result.success && result.data) {
				const path = boardPath(result.data);
				displayMessage($t('board.board_created'), 1500, true);
				if (path) {
					await goto(path);
					return;
				}
			} else {
				displayMessage(result.message);
			}
		} finally {
			creating = false;
		}
	}
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4">
	<div class="w-full max-w-md text-center">
		<div
			class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
		>
			<Layers class="h-6 w-6" />
		</div>
		<h2 class="text-xl font-semibold text-foreground">{$t('board.no_boards_yet')}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{$t('board.create_board_prompt')}</p>

		<form onsubmit={handleCreate} class="mt-6 space-y-3 text-left">
			<label for="first-board-name" class="text-sm font-medium text-foreground">
				{$t('board.board_name_label')}
			</label>
			<Input
				id="first-board-name"
				bind:value={name}
				placeholder={$t('board.board_name_placeholder')}
				disabled={creating}
			/>
			<Button type="submit" class="w-full" disabled={creating || !name.trim()}>
				{$t('board.create_board')}
			</Button>
		</form>
	</div>
</div>
