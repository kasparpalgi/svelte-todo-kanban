/** @file src/lib/stores/invoicing.svelte.ts */

import { browser } from '$app/environment';
import { call } from '$lib/api/call';
import type {
	InvoiceFieldsFragment,
	GetTodosForInvoicingQuery
} from '$lib/graphql/generated/graphql';
import { displayMessage } from './errorSuccess.svelte';

type InvoiceTodo = GetTodosForInvoicingQuery['todos'][number];

interface InvoicingState {
	invoices: InvoiceFieldsFragment[];
	todosForInvoicing: InvoiceTodo[];
	loading: boolean;
	error: string | null;
}

function createInvoicingStore() {
	const state = $state<InvoicingState>({
		invoices: [],
		todosForInvoicing: [],
		loading: false,
		error: null
	});

	async function loadBoardInvoices(boardId: string) {
		if (!browser) return;

		state.loading = true;
		state.error = null;

		try {
			state.invoices = await call('getInvoices', { boardId });
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load invoices';
		} finally {
			state.loading = false;
		}
	}

	async function loadAllInvoices() {
		if (!browser) return;

		state.loading = true;
		state.error = null;

		try {
			state.invoices = await call('getInvoices', {});
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load invoices';
		} finally {
			state.loading = false;
		}
	}

	async function loadTodosForInvoicing(boardId: string, listIds: string[]) {
		if (!browser || listIds.length === 0) return;

		try {
			state.todosForInvoicing = await call('getTodosForInvoicing', { boardId, listIds });
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load todos';
		}
	}

	async function getNextInvoiceNumber(): Promise<string> {
		if (!browser) return '';
		const today = new Date().toISOString().split('T')[0];
		try {
			const count = await call('countInvoicesIssued', { today });
			const yy = String(new Date().getFullYear()).slice(2);
			const mm = String(new Date().getMonth() + 1).padStart(2, '0');
			const dd = String(new Date().getDate()).padStart(2, '0');
			return `${yy}${mm}${dd}${count + 1}`;
		} catch {
			return '';
		}
	}

	async function createInvoice(params: {
		boardId: string;
		clientId: string;
		companyId?: string;
		invoiceNumber: string;
		issuedDate: string;
		dueDate?: string;
		currency: string;
		hourlyRate: number;
		notes?: string;
		customFields?: { label: string; value: string }[];
		selectedTodoIds: string[];
		todos: InvoiceTodo[];
	}) {
		// The server re-reads the cards and computes the hours and totals itself.
		const listIds = [...new Set(params.todos.map((t) => t.list_id).filter(Boolean))] as string[];
		try {
			const invoice = await call('createInvoice', {
				boardId: params.boardId,
				listIds,
				todoIds: params.selectedTodoIds,
				clientId: params.clientId,
				companyId: params.companyId || null,
				invoiceNumber: params.invoiceNumber,
				issuedDate: params.issuedDate,
				dueDate: params.dueDate || null,
				currency: params.currency,
				hourlyRate: params.hourlyRate,
				notes: params.notes || null,
				customFields: params.customFields ?? []
			});
			state.invoices = [invoice, ...state.invoices];
			return { success: true, message: 'Invoice created', data: invoice };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to create invoice';
			displayMessage(message);
			return { success: false, message };
		}
	}

	async function updateInvoiceStatus(id: string, status: string) {
		const idx = state.invoices.findIndex((inv) => inv.id === id);
		if (idx === -1) return { success: false, message: 'Invoice not found' };

		const original = state.invoices[idx].status;
		state.invoices[idx] = { ...state.invoices[idx], status };

		try {
			await call('updateInvoiceStatus', {
				id,
				status: status as 'draft' | 'sent' | 'paid' | 'cancelled'
			});
			return { success: true, message: 'Invoice status updated' };
		} catch (e) {
			state.invoices[idx] = { ...state.invoices[idx], status: original };
			const message = e instanceof Error ? e.message : 'Failed to update status';
			displayMessage(message);
			return { success: false, message };
		}
	}

	async function deleteInvoice(id: string) {
		const original = [...state.invoices];
		state.invoices = state.invoices.filter((inv) => inv.id !== id);

		try {
			await call('deleteInvoice', { id });
			return { success: true, message: 'Invoice deleted' };
		} catch (e) {
			state.invoices = original;
			const message = e instanceof Error ? e.message : 'Failed to delete invoice';
			displayMessage(message);
			return { success: false, message };
		}
	}

	return {
		get invoices() {
			return state.invoices;
		},
		get todosForInvoicing() {
			return state.todosForInvoicing;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		loadBoardInvoices,
		loadAllInvoices,
		loadTodosForInvoicing,
		getNextInvoiceNumber,
		createInvoice,
		updateInvoiceStatus,
		deleteInvoice
	};
}

export const invoicingStore = createInvoicingStore();
