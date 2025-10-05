<script lang="ts">
	/**
	 * @file WebhookManager.svelte
	 * Component for managing GitHub webhooks for real-time sync
	 */
	import { Button } from '$lib/components/ui/button';
	import { Webhook, CheckCircle, XCircle, Loader2 } from 'lucide-svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';

	let {
		owner,
		repo,
		boardId
	}: {
		owner: string;
		repo: string;
		boardId: string;
	} = $props();

	let webhookStatus = $state<{
		registered: boolean;
		webhookId?: number;
		active?: boolean;
		events?: string[];
		createdAt?: string;
		loading: boolean;
	}>({
		registered: false,
		loading: true
	});

	let actionLoading = $state(false);

	/**
	 * Check current webhook status
	 */
	async function checkWebhookStatus() {
		webhookStatus.loading = true;
		try {
			const response = await fetch(
				`/api/github/register-webhook?owner=${owner}&repo=${repo}`
			);

			if (!response.ok) {
				throw new Error('Failed to check webhook status');
			}

			const data = await response.json();
			webhookStatus = {
				...data,
				loading: false
			};
		} catch (error) {
			console.error('Error checking webhook status:', error);
			displayMessage('Failed to check webhook status');
			webhookStatus.loading = false;
		}
	}

	/**
	 * Register webhook
	 */
	async function registerWebhook() {
		actionLoading = true;
		try {
			const response = await fetch('/api/github/register-webhook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ owner, repo })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to register webhook');
			}

			if (data.alreadyExists) {
				displayMessage('Webhook already registered', 3000, true);
			} else {
				displayMessage('Webhook registered successfully! Real-time sync is now active.', 5000, true);
			}

			// Refresh status
			await checkWebhookStatus();
		} catch (error: any) {
			console.error('Error registering webhook:', error);
			displayMessage(error.message || 'Failed to register webhook');
		} finally {
			actionLoading = false;
		}
	}

	/**
	 * Unregister webhook
	 */
	async function unregisterWebhook() {
		if (!webhookStatus.webhookId) return;

		const confirmed = confirm(
			'Are you sure you want to disable real-time sync? You can re-enable it anytime.'
		);
		if (!confirmed) return;

		actionLoading = true;
		try {
			const response = await fetch('/api/github/register-webhook', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					owner,
					repo,
					webhookId: webhookStatus.webhookId
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Failed to unregister webhook');
			}

			displayMessage('Webhook removed successfully', 3000, true);

			// Refresh status
			await checkWebhookStatus();
		} catch (error: any) {
			console.error('Error unregistering webhook:', error);
			displayMessage(error.message || 'Failed to unregister webhook');
		} finally {
			actionLoading = false;
		}
	}

	// Check status on mount
	$effect(() => {
		if (owner && repo) {
			checkWebhookStatus();
		}
	});
</script>

<div class="rounded-lg border bg-card p-4">
	<div class="flex items-start gap-3">
		<div class="rounded-full bg-primary/10 p-2">
			<Webhook class="h-5 w-5 text-primary" />
		</div>

		<div class="flex-1 space-y-3">
			<div>
				<h3 class="font-semibold text-sm">Real-Time Sync</h3>
				<p class="text-xs text-muted-foreground mt-1">
					Enable webhooks to automatically sync changes from GitHub to your board.
				</p>
			</div>

			{#if webhookStatus.loading}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Checking webhook status...</span>
				</div>
			{:else if webhookStatus.registered}
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm">
						<CheckCircle class="h-4 w-4 text-green-600" />
						<span class="text-green-600 font-medium">Webhook Active</span>
					</div>

					{#if webhookStatus.events}
						<p class="text-xs text-muted-foreground">
							Listening for: {webhookStatus.events.join(', ')}
						</p>
					{/if}

					{#if webhookStatus.createdAt}
						<p class="text-xs text-muted-foreground">
							Registered: {new Date(webhookStatus.createdAt).toLocaleDateString()}
						</p>
					{/if}

					<Button
						variant="outline"
						size="sm"
						onclick={unregisterWebhook}
						disabled={actionLoading}
						class="mt-2"
					>
						{#if actionLoading}
							<Loader2 class="h-3 w-3 mr-2 animate-spin" />
						{/if}
						Disable Webhook
					</Button>
				</div>
			{:else}
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm">
						<XCircle class="h-4 w-4 text-muted-foreground" />
						<span class="text-muted-foreground">Webhook Not Registered</span>
					</div>

					<p class="text-xs text-muted-foreground">
						Enable real-time sync to automatically update todos when GitHub issues change.
					</p>

					<Button
						variant="default"
						size="sm"
						onclick={registerWebhook}
						disabled={actionLoading}
						class="mt-2"
					>
						{#if actionLoading}
							<Loader2 class="h-3 w-3 mr-2 animate-spin" />
						{/if}
						Enable Webhook
					</Button>
				</div>
			{/if}
		</div>
	</div>
</div>
