/** @file src/lib/stores/upgrade.svelte.ts
 * Drives the shared upgrade/upsell dialog. Any store that hits a free-plan limit
 * calls `upgradeStore.trigger(reason)`; <UpgradeDialog/> (mounted in the layout)
 * renders reason-specific copy and the checkout CTA.
 */
import type { UpgradeReason } from '$lib/config/plan';

function createUpgradeStore() {
	const state = $state({
		open: false,
		reason: 'boards' as UpgradeReason
	});

	function trigger(reason: UpgradeReason) {
		state.reason = reason;
		state.open = true;
	}

	function close() {
		state.open = false;
	}

	return {
		get open() {
			return state.open;
		},
		set open(value: boolean) {
			state.open = value;
		},
		get reason() {
			return state.reason;
		},
		trigger,
		close
	};
}

export const upgradeStore = createUpgradeStore();
