/** @file src/lib/components/settings/__tests__/PushNotificationSettings.svelte.test.ts */
// Brave, Opera and other Chromium forks without Google's push service reject
// pushManager.subscribe() with "Registration failed - push service error" (#214).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from '@vitest/browser/context';
import { readable } from 'svelte/store';
import PushNotificationSettings from '../PushNotificationSettings.svelte';
import { pushNotificationStore } from '$lib/stores/pushNotifications.svelte';
import { displayMessage } from '$lib/stores/errorSuccess.svelte';

vi.mock('$lib/i18n', () => ({ t: readable((key: string) => key) }));
vi.mock('$lib/stores/errorSuccess.svelte', () => ({ displayMessage: vi.fn() }));
vi.mock('$lib/stores/pushNotifications.svelte', () => ({
	pushNotificationStore: {
		supported: true,
		permission: 'default',
		subscribed: false,
		loading: false,
		error: null,
		refreshStatus: vi.fn(),
		subscribe: vi.fn(),
		unsubscribe: vi.fn()
	}
}));

describe('PushNotificationSettings', () => {
	beforeEach(() => vi.mocked(displayMessage).mockClear());

	it('turns the switch back off and explains a missing push service', async () => {
		vi.mocked(pushNotificationStore.subscribe).mockResolvedValue({
			success: false,
			message: 'Registration failed - push service error'
		});
		render(PushNotificationSettings);
		const toggle = page.getByRole('switch');

		await toggle.click();

		await expect.poll(() => displayMessage).toHaveBeenCalledWith('settings.push.error_no_service');
		await expect.element(toggle).toHaveAttribute('aria-checked', 'false');
	});

	it('shows any other failure message as-is', async () => {
		vi.mocked(pushNotificationStore.subscribe).mockResolvedValue({
			success: false,
			message: 'Push notifications are not configured'
		});
		render(PushNotificationSettings);

		await page.getByRole('switch').click();

		await expect
			.poll(() => displayMessage)
			.toHaveBeenCalledWith('Push notifications are not configured');
	});
});
