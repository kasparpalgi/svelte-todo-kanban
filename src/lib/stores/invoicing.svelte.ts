/** @file src/lib/stores/invoicing.svelte.ts */

import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import {
	GET_BOARD_INVOICES,
	GET_ALL_INVOICES,
	CREATE_INVOICE_WITH_ITEMS,
	UPDATE_INVOICE_STATUS,
	DELETE_INVOICE,
	GET_TODOS_FOR_INVOICING,
	GET_INVOICES_ISSUED_TODAY
} from '$lib/graphql/documents';
import type {
	GetBoardInvoicesQuery,
	GetAllInvoicesQuery,
	CreateInvoiceWithItemsMutation,
	InvoiceFieldsFragment,
	GetTodosForInvoicingQuery,
	GetInvoicesIssuedTodayQuery
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
			const data: GetBoardInvoicesQuery = await request(GET_BOARD_INVOICES, {
				board_id: boardId
			});
			state.invoices = data.invoices || [];
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
			const data: GetAllInvoicesQuery = await request(GET_ALL_INVOICES, {});
			state.invoices = data.invoices || [];
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load invoices';
		} finally {
			state.loading = false;
		}
	}

	async function loadTodosForInvoicing(listIds: string[]) {
		if (!browser || listIds.length === 0) return;

		try {
			const data: GetTodosForInvoicingQuery = await request(GET_TODOS_FOR_INVOICING, {
				list_ids: listIds
			});
			state.todosForInvoicing = data.todos || [];
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load todos';
		}
	}

	async function getNextInvoiceNumber(): Promise<string> {
		if (!browser) return '';
		const today = new Date().toISOString().split('T')[0];
		try {
			const data: GetInvoicesIssuedTodayQuery = await request(GET_INVOICES_ISSUED_TODAY, {
				today
			});
			const count = data.invoices_aggregate?.aggregate?.count ?? 0;
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
		const selectedTodos = params.todos.filter((t) => params.selectedTodoIds.includes(t.id));
		const totalHours = selectedTodos.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
		const totalAmount = totalHours * params.hourlyRate;

		try {
			const data: CreateInvoiceWithItemsMutation = await request(CREATE_INVOICE_WITH_ITEMS, {
				invoice: {
					board_id: params.boardId,
					client_id: params.clientId,
					company_id: params.companyId || null,
					invoice_number: params.invoiceNumber,
					issued_date: params.issuedDate,
					due_date: params.dueDate || null,
					currency: params.currency,
					hourly_rate: params.hourlyRate,
					total_hours: totalHours,
					total_amount: totalAmount,
					notes: params.notes || null,
					custom_fields: params.customFields?.length ? params.customFields : [],
					status: 'draft',
					items: {
						data: selectedTodos.map((todo) => ({
							todo_id: todo.id,
							title: todo.title,
							hours: todo.actual_hours || 0,
							hourly_rate: params.hourlyRate,
							amount: (todo.actual_hours || 0) * params.hourlyRate
						}))
					}
				}
			});

			const invoice = data.insert_invoices_one;
			if (invoice) {
				state.invoices = [invoice, ...state.invoices];
			}
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
			await request(UPDATE_INVOICE_STATUS, { id, status });
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
			await request(DELETE_INVOICE, { id });
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
