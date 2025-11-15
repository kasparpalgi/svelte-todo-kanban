<!-- @file src/routes/[lang]/[username]/[board]/CardModal.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { commentsStore } from '$lib/stores/comments.svelte';
	import { t, locale } from '$lib/i18n';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { CircleAlert } from 'lucide-svelte';
	import CardLoading from '$lib/components/card/CardLoading.svelte';
	import CardDetailView from '$lib/components/todo/CardDetailView.svelte';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';

	let { cardId, lang, onClose }: { cardId: string; lang: string; onClose: () => void } = $props();

	let todo = $state<TodoFieldsFragment | null>(null);
	let loading = $state(true);
	let isClosing = $state(false);
	let cardDetailView = $state<{ save: () => Promise<void> } | undefined>(undefined);

	$effect(() => {
		locale.set(lang);
	});

	$effect(() => {
		const foundTodo = todosStore.todos.find((t) => t.id === cardId);
		if (foundTodo && todo) {
			todo = foundTodo;
		}
	});

	onMount(async () => {
		if (!todosStore.initialized && !todosStore.loading) {
			await todosStore.loadTodosInitial();
		}

		while (todosStore.loading) {
			await new Promise((resolve) => setTimeout(resolve, 50));
		}

		// Load full todo details with comments and uploads
		// This replaces minimal data with complete data for the modal
		const fullTodo = await todosStore.loadTodoDetails(cardId);
		if (fullTodo) {
			todo = fullTodo;
			// Comments are now included in fullTodo, but load them for real-time updates
			await commentsStore.loadComments(cardId);
		} else {
			// Fallback: try to find todo in store if loadTodoDetails fails
			const foundTodo = todosStore.todos.find((t) => t.id === cardId);
			if (foundTodo) {
				todo = foundTodo;
				await commentsStore.loadComments(cardId);
			}
		}
		loading = false;
	});

	function closeModal() {
		isClosing = true;
		commentsStore.reset();
		setTimeout(() => {
			onClose();
		}, 50);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	async function handleSave() {
		if (cardDetailView) {
			await cardDetailView.save();
		} else {
			console.error('CardModal: cardDetailView instance NOT found!');
		}
	}

	async function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		} else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault();
			await handleSave();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
	class:opacity-0={isClosing}
	class:pointer-events-none={isClosing}
	onclick={handleBackdropClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			closeModal();
		}
	}}
	role="button"
	tabindex="-1"
>
	<div class="fixed inset-4 z-50 overflow-auto md:inset-8 lg:inset-16">
		<div
			class="mx-auto max-w-4xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				// Stop propagation except Esc & Ctrl+Enter (modal's main keydown will handle)
				if (e.key !== 'Escape' && !(e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
					e.stopPropagation();
				}
			}}
			role="dialog"
			tabindex="-1"
		>
			{#if loading}
				<CardLoading />
			{:else if !todo}
				<Card class="p-12 text-center">
					<CircleAlert class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h2 class="mb-2 text-xl font-semibold">{$t('card.card_not_found')}</h2>
					<p class="mb-4 text-muted-foreground">{$t('card.card_not_found_description')}</p>
					<Button onclick={closeModal}>{$t('card.go_back_to_board')}</Button>
				</Card>
			{:else}
				<CardDetailView bind:this={cardDetailView} {todo} {lang} onClose={closeModal} />
			{/if}
		</div>
	</div>
</div>
