/** @file src/routes/[lang]/[username]/[board]/[card]/+page.ts */
import { commentsStore } from '$lib/stores/comments.svelte';

export const load = async ({ params }) => {
	const cardId = params.card;
	if (cardId) {
		commentsStore.loadComments(cardId).catch((error) => {
			console.error('Failed to preload comments:', error);
		});
	}

	return {
		cardId
	};
};
