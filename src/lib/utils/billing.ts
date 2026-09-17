/** @file src/lib/utils/billing.ts
 * Client helper to kick off Stripe Checkout for the paid plan (#194).
 */
import { get } from 'svelte/store';
import { locale } from '$lib/i18n';
import { displayMessage } from '$lib/stores/errorSuccess.svelte';

/**
 * Starts checkout: asks the server for a Checkout Session URL and redirects to it.
 * Returns false (and shows a message) when checkout could not be started.
 */
export async function startCheckout(): Promise<boolean> {
	try {
		const response = await fetch('/api/billing/checkout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lang: get(locale) })
		});
		const data = await response.json();

		if (response.ok && data.url) {
			window.location.href = data.url;
			return true;
		}

		displayMessage(data.error || 'Could not start checkout. Please try again.');
		return false;
	} catch (error) {
		displayMessage(error instanceof Error ? error.message : 'Checkout failed');
		return false;
	}
}
