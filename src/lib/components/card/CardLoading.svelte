<script lang="ts">
	import { t } from '$lib/i18n';
	import { Card } from '../ui/card';
</script>

<Card class="p-12 text-center">
	<div class="flex items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
		></div>
		<span class="ml-3">{$t('card.loading_card')}</span>
	</div>
</Card>
