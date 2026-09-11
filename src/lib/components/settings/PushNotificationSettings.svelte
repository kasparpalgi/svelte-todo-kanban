<!-- @file src/lib/components/settings/PushNotificationSettings.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { BellRing } from 'lucide-svelte';
	import { pushNotificationStore } from '$lib/stores/pushNotifications.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	onMount(() => {
		pushNotificationStore.refreshStatus();
	});

	async function handleToggle(checked: boolean) {
		const result = checked
			? await pushNotificationStore.subscribe()
			: await pushNotificationStore.unsubscribe();

		if (!result.success) {
			displayMessage(result.message);
		}
	}
</script>

{#if pushNotificationStore.supported}
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<BellRing class="h-5 w-5" />
				{$t('settings.push.title')}
			</CardTitle>
			<CardDescription>{$t('settings.push.description')}</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex items-center justify-between">
				<div class="space-y-0.5">
					<Label>{$t('settings.push.enable')}</Label>
					<p class="text-sm text-muted-foreground">
						{pushNotificationStore.permission === 'denied'
							? $t('settings.push.blocked')
							: $t('settings.push.enable_description')}
					</p>
				</div>
				<Switch
					checked={pushNotificationStore.subscribed}
					onCheckedChange={handleToggle}
					disabled={pushNotificationStore.loading || pushNotificationStore.permission === 'denied'}
				/>
			</div>
		</CardContent>
	</Card>
{/if}
