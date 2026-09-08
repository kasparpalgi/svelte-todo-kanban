/** @file src/lib/stores/clients.svelte.ts */

import { browser } from '$app/environment';
import { request } from '$lib/graphql/client';
import { GET_CLIENTS, CREATE_CLIENT, UPDATE_CLIENT, DELETE_CLIENT } from '$lib/graphql/documents';
import type {
	GetClientsQuery,
	CreateClientMutation,
	UpdateClientMutation,
	ClientFieldsFragment
} from '$lib/graphql/generated/graphql';
import { displayMessage } from './errorSuccess.svelte';

interface ClientsState {
	clients: ClientFieldsFragment[];
	loading: boolean;
	error: string | null;
}

function createClientsStore() {
	const state = $state<ClientsState>({
		clients: [],
		loading: false,
		error: null
	});

	async function loadClients() {
		if (!browser) return;

		state.loading = true;
		state.error = null;

		try {
			const data: GetClientsQuery = await request(GET_CLIENTS, {});
			state.clients = data.clients || [];
		} catch (e) {
			state.error = e instanceof Error ? e.message : 'Failed to load clients';
		} finally {
			state.loading = false;
		}
	}

	async function createClient(
		input: Omit<ClientFieldsFragment, 'id' | 'user_id' | 'created_at' | 'updated_at'>
	) {
		try {
			const data: CreateClientMutation = await request(CREATE_CLIENT, { object: input });
			const client = data.insert_clients_one;
			if (client) {
				state.clients = [...state.clients, client].sort((a, b) => a.name.localeCompare(b.name));
			}
			return { success: true, message: 'Client created', data: client };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to create client';
			displayMessage(message);
			return { success: false, message };
		}
	}

	async function updateClient(id: string, updates: Partial<ClientFieldsFragment>) {
		const idx = state.clients.findIndex((c) => c.id === id);
		if (idx === -1) return { success: false, message: 'Client not found' };

		const original = { ...state.clients[idx] };
		state.clients[idx] = { ...original, ...updates };

		try {
			const data: UpdateClientMutation = await request(UPDATE_CLIENT, { id, _set: updates });
			const updated = data.update_clients_by_pk;
			if (updated) state.clients[idx] = updated;
			return { success: true, message: 'Client updated', data: updated };
		} catch (e) {
			state.clients[idx] = original;
			const message = e instanceof Error ? e.message : 'Failed to update client';
			displayMessage(message);
			return { success: false, message };
		}
	}

	async function deleteClient(id: string) {
		const idx = state.clients.findIndex((c) => c.id === id);
		const original = [...state.clients];

		state.clients = state.clients.filter((c) => c.id !== id);

		try {
			await request(DELETE_CLIENT, { id });
			return { success: true, message: 'Client deleted' };
		} catch (e) {
			state.clients = original;
			const message = e instanceof Error ? e.message : 'Failed to delete client';
			displayMessage(message);
			return { success: false, message };
		}
	}

	return {
		get clients() {
			return state.clients;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		loadClients,
		createClient,
		updateClient,
		deleteClient
	};
}

export const clientsStore = createClientsStore();
