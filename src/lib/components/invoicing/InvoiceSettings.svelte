<!-- @file src/lib/components/invoicing/InvoiceSettings.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import ClientsManagement from './ClientsManagement.svelte';
	import InvoiceCompaniesManagement from './InvoiceCompaniesManagement.svelte';

	let activeTab = $state<'clients' | 'companies'>('clients');
</script>

<div class="space-y-4">
	<div class="flex gap-2 border-b">
		<button
			class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'clients'
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'clients')}
		>
			{$t('invoicing_settings.clients_tab')}
		</button>
		<button
			class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'companies'
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'companies')}
		>
			{$t('invoicing_settings.companies_tab')}
		</button>
	</div>

	{#if activeTab === 'clients'}
		<ClientsManagement />
	{:else}
		<InvoiceCompaniesManagement />
	{/if}
</div>
