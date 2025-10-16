<!-- @file src/lib/components/todo/CardHourTracking.svelte -->
<script lang="ts">
	import { scale } from 'svelte/transition';
	import { t } from '$lib/i18n';
	import { calculateAverageHours } from '$lib/utils/cardHelpers';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Clock, Pencil } from 'lucide-svelte';

	let {
		min_hours  = $bindable(),
		max_hours = $bindable(),
		actual_hours = $bindable(),
		comment_hours = $bindable()
	}: {
		min_hours: number | null;
		max_hours: number | null;
		actual_hours: number | null;
		comment_hours: string;
	} = $props();

	let commentInputVisible = $state(!!comment_hours);
</script>

<div>
	<div class="mb-2 flex items-center">
		<Clock class="mr-2 h-4 w-4" />{$t('card.hour_tracking')}
	</div>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div>
			<Label for="min_hours">{$t('card.min_hours')}</Label>
			<Input id="min_hours" type="number" bind:value={min_hours} />
		</div>
		<div>
			<Label for="max_hours">{$t('card.max_hours')}</Label>
			<Input id="max_hours" type="number" bind:value={max_hours} />
		</div>
		<div>
			<Label for="actual_hours">{$t('card.actual_hours')}</Label>
			<Input id="actual_hours" type="number" bind:value={actual_hours} />
		</div>
		{#if min_hours && max_hours}
			<div in:scale class="col-span-2 mt-5 text-2xl sm:col-span-1">
				~{calculateAverageHours(min_hours, max_hours)}h
			</div>
		{/if}
	</div>

	{#if !commentInputVisible}
		<button
			type="button"
			onclick={() => (commentInputVisible = true)}
			class="mt-4 cursor-pointer p-0 text-sm text-muted-foreground hover:underline"
		>
			{$t('card.add_hours_comment')}
		</button>
	{:else}
		<div class="mt-4">
			<Label for="comment_hours" class="flex items-center gap-1.5">
				{$t('card.comment_hours')}
				{#if comment_hours}
					<Pencil class="h-3 w-3 text-muted-foreground" />
				{/if}
			</Label>
			<Textarea id="comment_hours" bind:value={comment_hours} />
		</div>
	{/if}
</div>
