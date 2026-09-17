<!-- @file src/lib/components/plan/UpgradeDialog.svelte
	Shared upsell dialog, driven by upgradeStore. Rendered once in the app layout.
	Copy is reason-specific; the CTA starts Stripe Checkout. -->
<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles, Check } from 'lucide-svelte';
	import { t } from '$lib/i18n';
	import { upgradeStore } from '$lib/stores/upgrade.svelte';
	import { PAID_PRICE_EUR } from '$lib/config/plan';
	import { startCheckout } from '$lib/utils/billing';

	let loading = $state(false);

	const reasonKey = $derived(upgradeStore.reason);

	const perks = $derived([
		$t('plan.perks.boards'),
		$t('plan.perks.cards'),
		$t('plan.perks.collaborators'),
		$t('plan.perks.uploads'),
		$t('plan.perks.ai')
	]);

	async function handleUpgrade() {
		loading = true;
		const ok = await startCheckout();
		if (!ok) loading = false;
	}
</script>

<Dialog bind:open={upgradeStore.open}>
	<DialogContent class="max-w-md">
		<DialogHeader class="space-y-3">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
				>
					<Sparkles class="h-5 w-5" />
				</div>
				<DialogTitle class="text-left text-lg font-semibold">
					{$t('plan.upgrade.title')}
				</DialogTitle>
			</div>
			<DialogDescription class="text-left text-sm text-muted-foreground">
				{$t(`plan.reason.${reasonKey}`)}
			</DialogDescription>
		</DialogHeader>

		<ul class="space-y-2 py-2">
			{#each perks as perk}
				<li class="flex items-start gap-2 text-sm">
					<Check class="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
					<span>{perk}</span>
				</li>
			{/each}
		</ul>

		<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
			<Button variant="ghost" onclick={() => upgradeStore.close()} class="sm:w-auto">
				{$t('plan.upgrade.not_now')}
			</Button>
			<Button onclick={handleUpgrade} disabled={loading} class="gap-2 sm:w-auto">
				<Sparkles class="h-4 w-4" />
				{loading
					? $t('plan.upgrade.redirecting')
					: $t('plan.upgrade.cta', { price: PAID_PRICE_EUR })}
			</Button>
		</div>
	</DialogContent>
</Dialog>
