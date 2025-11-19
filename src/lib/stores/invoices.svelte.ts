/** @file src/lib/stores/invoices.svelte.ts */
import {
	GET_INVOICES,
	GET_INVOICE_BY_ID,
	GET_BOARD_INVOICES,
	CREATE_INVOICE,
	UPDATE_INVOICE,
	DELETE_INVOICE,
	CREATE_INVOICE_ITEM,
	UPDATE_INVOICE_ITEM,
	DELETE_INVOICE_ITEM,
	UPDATE_TODO_INVOICED_HOURS
} from '$lib/graphql/documents';
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';

// Types will be generated after migration is applied
type Invoice = any;
type InvoiceItem = any;

interface InvoicesState {
	invoices: Invoice[];
	currentInvoice: Invoice | null;
	invoiceItems: InvoiceItem[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

interface StoreResult {
	success: boolean;
	message: string;
	data?: any;
}

function createInvoicesStore() {
	const state = $state<InvoicesState>({
		invoices: [],
		currentInvoice: null,
		invoiceItems: [],
		loading: false,
		error: null,
		initialized: false
	});

	/**
	 * Load all invoices
	 */
	async function loadInvoices(): Promise<Invoice[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const data = await request(GET_INVOICES, {
				where: {},
				order_by: [{ created_at: 'desc' as any }]
			});

			state.invoices = data.invoices || [];
			state.initialized = true;
			return state.invoices;
		} catch (error) {
			let message = 'Error loading invoices';

			if (error instanceof Error) {
				if (error.message.includes('Not authenticated')) {
					message = 'Please sign in to view invoices';
				} else if (error.message.includes('access-denied')) {
					message = 'Access denied - please check your permissions';
				} else {
					message = error.message;
				}
			}

			state.error = message;
			console.error('Load invoices error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Load invoices for a specific board
	 */
	async function loadBoardInvoices(boardId: string): Promise<Invoice[]> {
		if (!browser) return [];

		state.loading = true;
		state.error = null;

		try {
			const data = await request(GET_BOARD_INVOICES, { board_id: boardId });

			state.invoices = data.invoices || [];
			state.initialized = true;
			return state.invoices;
		} catch (error) {
			let message = 'Error loading board invoices';

			if (error instanceof Error) {
				message = error.message;
			}

			state.error = message;
			console.error('Load board invoices error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Load a single invoice by ID with items
	 */
	async function loadInvoiceById(id: string): Promise<Invoice | null> {
		if (!browser) return null;

		state.loading = true;
		state.error = null;

		try {
			const data = await request(GET_INVOICE_BY_ID, { id });

			if (data.invoices_by_pk) {
				state.currentInvoice = data.invoices_by_pk;
				state.invoiceItems = data.invoices_by_pk.invoice_items || [];
				return state.currentInvoice;
			}

			return null;
		} catch (error) {
			let message = 'Error loading invoice';

			if (error instanceof Error) {
				message = error.message;
			}

			state.error = message;
			console.error('Load invoice error:', error);
			return null;
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Create a new invoice
	 */
	async function createInvoice(invoiceData: {
		invoice_number: string;
		board_id: string;
		invoice_date: string;
		due_date?: string;
		status?: string;
		customer_details: object;
		invoice_from_details: object;
		subtotal: number;
		tax_rate?: number;
		tax_amount?: number;
		total: number;
		notes?: string;
	}): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const result = await request(CREATE_INVOICE, {
				object: {
					...invoiceData,
					status: invoiceData.status || 'draft'
				}
			});

			const newInvoice = result.insert_invoices_one;

			if (newInvoice) {
				// Optimistic update
				state.invoices = [newInvoice, ...state.invoices];
				state.currentInvoice = newInvoice;

				return {
					success: true,
					message: 'Invoice created successfully',
					data: newInvoice
				};
			}

			return { success: false, message: 'Failed to create invoice' };
		} catch (error) {
			let message = 'Error creating invoice';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Create invoice error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Update an existing invoice
	 */
	async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Save original for rollback
		const originalIdx = state.invoices.findIndex((inv) => inv.id === id);
		const original = originalIdx >= 0 ? { ...state.invoices[originalIdx] } : null;

		// Optimistic update
		if (originalIdx >= 0) {
			state.invoices[originalIdx] = { ...state.invoices[originalIdx], ...updates };
		}

		if (state.currentInvoice?.id === id) {
			state.currentInvoice = { ...state.currentInvoice, ...updates };
		}

		try {
			const result = await request(UPDATE_INVOICE, {
				id,
				set: updates
			});

			const updated = result.update_invoices_by_pk;

			if (updated) {
				// Update with server data
				if (originalIdx >= 0) {
					state.invoices[originalIdx] = updated;
				}
				if (state.currentInvoice?.id === id) {
					state.currentInvoice = updated;
				}

				return {
					success: true,
					message: 'Invoice updated successfully',
					data: updated
				};
			}

			// Rollback on failure
			if (original && originalIdx >= 0) {
				state.invoices[originalIdx] = original;
			}

			return { success: false, message: 'Failed to update invoice' };
		} catch (error) {
			// Rollback on error
			if (original && originalIdx >= 0) {
				state.invoices[originalIdx] = original;
			}

			let message = 'Error updating invoice';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Update invoice error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Delete an invoice
	 */
	async function deleteInvoice(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Save original for rollback
		const originalIdx = state.invoices.findIndex((inv) => inv.id === id);
		const original = originalIdx >= 0 ? state.invoices[originalIdx] : null;

		// Optimistic update
		state.invoices = state.invoices.filter((inv) => inv.id !== id);
		if (state.currentInvoice?.id === id) {
			state.currentInvoice = null;
		}

		try {
			await request(DELETE_INVOICE, { id });

			return {
				success: true,
				message: 'Invoice deleted successfully'
			};
		} catch (error) {
			// Rollback on error
			if (original) {
				state.invoices = [...state.invoices, original].sort(
					(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				);
			}

			let message = 'Error deleting invoice';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Delete invoice error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Add an item to an invoice
	 */
	async function addInvoiceItem(itemData: {
		invoice_id: string;
		todo_id?: string;
		description: string;
		hours: number;
		rate: number;
		amount: number;
		sort_order: number;
	}): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			const result = await request(CREATE_INVOICE_ITEM, {
				object: itemData
			});

			const newItem = result.insert_invoice_items_one;

			if (newItem) {
				// Update items list
				state.invoiceItems = [...state.invoiceItems, newItem];

				return {
					success: true,
					message: 'Invoice item added successfully',
					data: newItem
				};
			}

			return { success: false, message: 'Failed to add invoice item' };
		} catch (error) {
			let message = 'Error adding invoice item';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Add invoice item error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Update an invoice item
	 */
	async function updateInvoiceItem(
		id: string,
		updates: Partial<InvoiceItem>
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Save original for rollback
		const originalIdx = state.invoiceItems.findIndex((item) => item.id === id);
		const original = originalIdx >= 0 ? { ...state.invoiceItems[originalIdx] } : null;

		// Optimistic update
		if (originalIdx >= 0) {
			state.invoiceItems[originalIdx] = { ...state.invoiceItems[originalIdx], ...updates };
		}

		try {
			const result = await request(UPDATE_INVOICE_ITEM, {
				id,
				set: updates
			});

			const updated = result.update_invoice_items_by_pk;

			if (updated) {
				// Update with server data
				if (originalIdx >= 0) {
					state.invoiceItems[originalIdx] = updated;
				}

				return {
					success: true,
					message: 'Invoice item updated successfully',
					data: updated
				};
			}

			// Rollback on failure
			if (original && originalIdx >= 0) {
				state.invoiceItems[originalIdx] = original;
			}

			return { success: false, message: 'Failed to update invoice item' };
		} catch (error) {
			// Rollback on error
			if (original && originalIdx >= 0) {
				state.invoiceItems[originalIdx] = original;
			}

			let message = 'Error updating invoice item';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Update invoice item error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Delete an invoice item
	 */
	async function deleteInvoiceItem(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		// Save original for rollback
		const originalIdx = state.invoiceItems.findIndex((item) => item.id === id);
		const original = originalIdx >= 0 ? state.invoiceItems[originalIdx] : null;

		// Optimistic update
		state.invoiceItems = state.invoiceItems.filter((item) => item.id !== id);

		try {
			await request(DELETE_INVOICE_ITEM, { id });

			return {
				success: true,
				message: 'Invoice item deleted successfully'
			};
		} catch (error) {
			// Rollback on error
			if (original) {
				state.invoiceItems = [...state.invoiceItems, original].sort(
					(a, b) => a.sort_order - b.sort_order
				);
			}

			let message = 'Error deleting invoice item';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Delete invoice item error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Update invoiced hours on a todo
	 */
	async function updateTodoInvoicedHours(
		todoId: string,
		invoicedHours: number
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			await request(UPDATE_TODO_INVOICED_HOURS, {
				id: todoId,
				invoiced_hours: invoicedHours
			});

			return {
				success: true,
				message: 'Todo invoiced hours updated successfully'
			};
		} catch (error) {
			let message = 'Error updating todo invoiced hours';

			if (error instanceof Error) {
				message = error.message;
			}

			console.error('Update todo invoiced hours error:', error);
			return { success: false, message };
		}
	}

	/**
	 * Calculate invoice totals from items
	 */
	function calculateInvoiceTotals(items: InvoiceItem[], taxRate: number = 0) {
		const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
		const taxAmount = subtotal * (taxRate / 100);
		const total = subtotal + taxAmount;

		return { subtotal, taxAmount, total };
	}

	/**
	 * Generate next invoice number (simple incremental)
	 */
	function generateInvoiceNumber(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const count = state.invoices.length + 1;

		return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
	}

	return {
		// State getters
		get invoices() {
			return state.invoices;
		},
		get currentInvoice() {
			return state.currentInvoice;
		},
		get invoiceItems() {
			return state.invoiceItems;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get initialized() {
			return state.initialized;
		},

		// Methods
		loadInvoices,
		loadBoardInvoices,
		loadInvoiceById,
		createInvoice,
		updateInvoice,
		deleteInvoice,
		addInvoiceItem,
		updateInvoiceItem,
		deleteInvoiceItem,
		updateTodoInvoicedHours,
		calculateInvoiceTotals,
		generateInvoiceNumber
	};
}

export const invoicesStore = createInvoicesStore();
