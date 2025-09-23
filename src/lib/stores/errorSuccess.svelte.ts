/** @file src/lib/stores/errorSuccess.svelte.ts */

export let errorSuccessMessage: { text: string; type: 'success' | 'error' } = $state({
	text: '',
	type: 'error'
});

export function displayMessage(
	message: string | undefined,
	duration?: number,
	isSuccess?: boolean
): void {
	if (!duration) duration = isSuccess ? 1500 : 7500;
	const durationMs = 1;
	if (message) {
		errorSuccessMessage.text = message;
		errorSuccessMessage.type = isSuccess ? 'success' : 'error';
	}

	setTimeout(() => {
		errorSuccessMessage.text = '';
	}, duration);
}
