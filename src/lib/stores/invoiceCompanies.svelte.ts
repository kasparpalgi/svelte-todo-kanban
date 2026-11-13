/** @file src/lib/stores/invoiceCompanies.svelte.ts */

import { browser } from '$app/environment';
import { call } from '$lib/api/call';
import type { InvoiceCompanyFieldsFragment } from '$lib/graphql/generated/graphql';
import { displayMessage } from './errorSuccess.svelte';

interface InvoiceCompaniesState {
	companies: InvoiceCompanyFieldsFragment[];
	loading: boolean;
	error: string | null;
}

function createInvoiceCompaniesStore() {
	const state = $state<InvoiceCompaniesState>({
		companies: [],
		loading: false,
		error: null
	});

	async function loadCompanies() {
		if (!browser) return;
		state.loading = true;
		state.error = null;
		try {
			state.companies = await call('getInvoiceCompanies', {});
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load companies';
		} finally {
			state.loading = false;
		}
	}

	async function createCompany(
		input: Omit<InvoiceCompanyFieldsFragment, 'id' | 'user_id' | 'created_at' | 'updated_at'>
	) {
		try {
			const company = await call('createInvoiceCompany', input);
			if (company) {
				state.companies = [...state.companies, company].sort((a, b) => {
					if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
					return a.name.localeCompare(b.name);
				});
			}
			return { success: true, message: 'Company created', data: company };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to create company';
			displayMessage(message);
			return { success: false, message };
		}
	}

	async function updateCompany(id: string, updates: Partial<InvoiceCompanyFieldsFragment>) {
		const idx = state.companies.findIndex((c) => c.id === id);
		if (idx === -1) return { success: false, message: 'Company not found' };

		const original = { ...state.companies[idx] };
		state.companies[idx] = { ...original, ...updates };

		try {
			const updated = await call('updateInvoiceCompany', { id, set: updates });
			if (updated) state.companies[idx] = updated;
			return { success: true, message: 'Company updated', data: updated };
		} catch (e) {
			state.companies[idx] = original;
			const message = e instanceof Error ? e.message : 'Failed to update company';
			displayMessage(message);
			return { success: false, message };
		}
	}

	async function deleteCompany(id: string) {
		const original = [...state.companies];
		state.companies = state.companies.filter((c) => c.id !== id);
		try {
			await call('deleteInvoiceCompany', { id });
			return { success: true, message: 'Company deleted' };
		} catch (e) {
			state.companies = original;
			const message = e instanceof Error ? e.message : 'Failed to delete company';
			displayMessage(message);
			return { success: false, message };
		}
	}

	return {
		get companies() {
			return state.companies;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		loadCompanies,
		createCompany,
		updateCompany,
		deleteCompany
	};
}

export const invoiceCompaniesStore = createInvoiceCompaniesStore();
