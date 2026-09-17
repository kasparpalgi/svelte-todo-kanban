<!-- @file src/lib/components/settings/PlanSettings.svelte
	Plan status + upgrade CTA, and (free plan) bring-your-own API keys for OpenAI
	and Cloudflare R2. Keys are sent to /api/keys which encrypts them server-side. -->
<script lang="ts">
	import { userStore } from '$lib/stores/user.svelte';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Sparkles, Check, KeyRound, Eye, EyeOff, CircleCheckBig } from 'lucide-svelte';
	import { isPaid, PAID_PRICE_EUR } from '$lib/config/plan';
	import { startCheckout } from '$lib/utils/billing';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	const user = $derived(userStore.user);
	const paid = $derived(isPaid(user));

	let checkoutLoading = $state(false);
	let savingKeys = $state(false);
	let showOpenAiKey = $state(false);
	let showR2Secret = $state(false);

	// BYO key inputs. Secrets are never pre-filled; we only show whether one is set.
	let openaiKey = $state('');
	let r2 = $state({
		accountId: '',
		accessKeyId: '',
		secretAccessKey: '',
		bucket: '',
		publicBaseUrl: ''
	});
	let initialized = $state(false);

	const openaiConfigured = $derived(!!user?.settings?.tokens?.openai?.encrypted);
	const r2Configured = $derived(!!user?.settings?.tokens?.r2?.encrypted);

	$effect(() => {
		// Reflect a returning Stripe Checkout redirect once translations are ready.
		if (!initialized && user) {
			const result = page.url.searchParams.get('upgrade');
			if (result === 'success') {
				displayMessage($t('plan.checkout.success'), 6000, true);
			} else if (result === 'cancel') {
				displayMessage($t('plan.checkout.cancelled'), 4000);
			}
			initialized = true;
		}
	});

	const perks = $derived([
		$t('plan.perks.boards'),
		$t('plan.perks.cards'),
		$t('plan.perks.collaborators'),
		$t('plan.perks.uploads'),
		$t('plan.perks.ai')
	]);

	async function handleUpgrade() {
		checkoutLoading = true;
		const ok = await startCheckout();
		if (!ok) checkoutLoading = false;
	}

	async function saveKeys() {
		if (!user?.id) return;
		savingKeys = true;

		const body: Record<string, unknown> = {};
		if (openaiKey.trim()) body.openai = openaiKey.trim();

		const r2Filled =
			r2.accountId && r2.accessKeyId && r2.secretAccessKey && r2.bucket && r2.publicBaseUrl;
		if (r2Filled) body.r2 = { ...r2 };

		if (Object.keys(body).length === 0) {
			savingKeys = false;
			displayMessage($t('plan.keys.nothing_to_save'));
			return;
		}

		try {
			const response = await fetch('/api/keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const data = await response.json();

			if (response.ok && data.success) {
				// Mirror into the cached user so the "configured" badges update immediately.
				const tokens = { ...(user.settings?.tokens || {}) };
				if (data.openaiSet) tokens.openai = { encrypted: true };
				if (data.r2Set) tokens.r2 = { encrypted: true };
				await userStore.updateUser(
					user.id,
					{ settings: { ...(user.settings || {}), tokens } },
					true
				);

				openaiKey = '';
				r2 = {
					accountId: '',
					accessKeyId: '',
					secretAccessKey: '',
					bucket: '',
					publicBaseUrl: ''
				};
				displayMessage($t('plan.keys.saved'), 3000, true);
			} else {
				displayMessage(data.error || $t('plan.keys.save_failed'));
			}
		} catch (error) {
			displayMessage(error instanceof Error ? error.message : $t('plan.keys.save_failed'));
		} finally {
			savingKeys = false;
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Sparkles class="h-5 w-5" />
			{$t('plan.title')}
		</CardTitle>
		<CardDescription>{$t('plan.description')}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		{#if paid}
			<div
				class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
			>
				<CircleCheckBig class="h-4 w-4 shrink-0" />
				<span class="text-sm">{$t('plan.status.paid')}</span>
			</div>
			{#if user?.plan_expires_at}
				<p class="text-xs text-muted-foreground">
					{$t('plan.status.renews', {
						date: new Date(user.plan_expires_at).toLocaleDateString()
					})}
				</p>
			{/if}
		{:else}
			<div class="rounded-lg border p-4">
				<p class="mb-3 text-sm font-medium">{$t('plan.status.free')}</p>
				<ul class="space-y-2">
					{#each perks as perk}
						<li class="flex items-start gap-2 text-sm">
							<Check class="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
							<span>{perk}</span>
						</li>
					{/each}
				</ul>
				<Button onclick={handleUpgrade} disabled={checkoutLoading} class="mt-4 w-full gap-2">
					<Sparkles class="h-4 w-4" />
					{checkoutLoading
						? $t('plan.upgrade.redirecting')
						: $t('plan.upgrade.cta', { price: PAID_PRICE_EUR })}
				</Button>
			</div>

			<div class="space-y-4 border-t pt-4">
				<div class="flex items-center gap-2">
					<KeyRound class="h-4 w-4" />
					<h3 class="text-sm font-medium">{$t('plan.keys.title')}</h3>
				</div>
				<p class="text-xs text-muted-foreground">{$t('plan.keys.description')}</p>

				<div class="space-y-2">
					<Label for="openai-key">
						{$t('plan.keys.openai_label')}
						{#if openaiConfigured}
							<span class="ml-1 text-xs text-green-600 dark:text-green-400"
								>· {$t('plan.keys.configured')}</span
							>
						{/if}
					</Label>
					<div class="relative">
						<Input
							id="openai-key"
							type={showOpenAiKey ? 'text' : 'password'}
							bind:value={openaiKey}
							placeholder={openaiConfigured ? '••••••••••••' : 'sk-...'}
							class="pr-10"
						/>
						<button
							type="button"
							onclick={() => (showOpenAiKey = !showOpenAiKey)}
							class="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={showOpenAiKey ? $t('common.hide') : $t('common.show')}
						>
							{#if showOpenAiKey}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				<div class="space-y-2">
					<Label>
						{$t('plan.keys.r2_label')}
						{#if r2Configured}
							<span class="ml-1 text-xs text-green-600 dark:text-green-400"
								>· {$t('plan.keys.configured')}</span
							>
						{/if}
					</Label>
					<p class="text-xs text-muted-foreground">{$t('plan.keys.r2_hint')}</p>
					<Input bind:value={r2.accountId} placeholder={$t('plan.keys.r2_account_id')} />
					<Input bind:value={r2.accessKeyId} placeholder={$t('plan.keys.r2_access_key')} />
					<div class="relative">
						<Input
							type={showR2Secret ? 'text' : 'password'}
							bind:value={r2.secretAccessKey}
							placeholder={$t('plan.keys.r2_secret')}
							class="pr-10"
						/>
						<button
							type="button"
							onclick={() => (showR2Secret = !showR2Secret)}
							class="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={showR2Secret ? $t('common.hide') : $t('common.show')}
						>
							{#if showR2Secret}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					<Input bind:value={r2.bucket} placeholder={$t('plan.keys.r2_bucket')} />
					<Input bind:value={r2.publicBaseUrl} placeholder={$t('plan.keys.r2_public_url')} />
				</div>

				<Button
					type="button"
					variant="outline"
					onclick={saveKeys}
					disabled={savingKeys}
					class="w-full"
				>
					{savingKeys ? $t('plan.keys.saving') : $t('plan.keys.save')}
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>
