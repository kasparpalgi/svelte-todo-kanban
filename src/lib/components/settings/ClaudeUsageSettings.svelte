<!-- @file src/lib/components/settings/ClaudeUsageSettings.svelte
	Claude plan selector (#21/#27): which flat subscription (if any) the user pays,
	so cards can amortize it into an effective cost alongside the API-list cost. -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
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
	import { Sparkles } from 'lucide-svelte';

	const user = $derived(userStore.user);

	let plan = $state('');
	let monthly = $state('');
	let currency = $state('EUR');
	let initialized = $state(false);
	let saving = $state(false);

	$effect(() => {
		if (user && !initialized) {
			plan = user.claude_plan || '';
			monthly = user.claude_plan_monthly ? String(user.claude_plan_monthly) : '';
			currency = user.claude_plan_currency || 'EUR';
			initialized = true;
		}
	});

	async function save() {
		if (!user?.id) return;
		saving = true;

		const result = await userStore.updateUser(
			user.id,
			{
				claude_plan: plan || null,
				claude_plan_monthly: plan && monthly ? Number(monthly) : null,
				claude_plan_currency: currency
			},
			true
		);

		if (result.success) {
			displayMessage($t('settings.claude_usage.saved'), 2000, true);
		}

		saving = false;
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Sparkles class="h-5 w-5" />
			{$t('settings.claude_usage.title')}
		</CardTitle>
		<CardDescription>{$t('settings.claude_usage.description')}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label for="claude-plan">{$t('settings.claude_usage.plan_label')}</Label>
			<select
				id="claude-plan"
				bind:value={plan}
				class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
			>
				<option value="">{$t('settings.claude_usage.plan_none')}</option>
				<option value="api">{$t('settings.claude_usage.plan_api')}</option>
				<option value="pro">{$t('settings.claude_usage.plan_pro')}</option>
				<option value="max5x">{$t('settings.claude_usage.plan_max5x')}</option>
				<option value="max20x">{$t('settings.claude_usage.plan_max20x')}</option>
			</select>
		</div>

		{#if plan && plan !== 'api'}
			<div class="flex gap-2">
				<div class="flex-1 space-y-2">
					<Label for="claude-monthly">{$t('settings.claude_usage.monthly_label')}</Label>
					<Input id="claude-monthly" type="number" min="0" step="0.01" bind:value={monthly} />
				</div>
				<div class="w-24 space-y-2">
					<Label for="claude-currency">{$t('settings.claude_usage.currency_label')}</Label>
					<select
						id="claude-currency"
						bind:value={currency}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="EUR">EUR</option>
						<option value="USD">USD</option>
						<option value="GBP">GBP</option>
					</select>
				</div>
			</div>
		{/if}

		<Button type="button" size="sm" onclick={save} disabled={saving}>
			{$t('settings.claude_usage.save')}
		</Button>
	</CardContent>
</Card>
