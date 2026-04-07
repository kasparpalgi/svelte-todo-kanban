/** @file src/lib/stores/podcasts.svelte.ts */
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import { PUBLIC_API_ENDPOINT, PUBLIC_API_ENDPOINT_DEV, PUBLIC_API_ENV } from '$env/static/public';
import {
	INSERT_PODCAST,
	UPDATE_PODCAST_TRANSCRIPTION,
	DELETE_PODCAST,
	UPDATE_PODCAST
} from '$lib/graphql/documents';
import type {
	GetPodcastsQuery,
	InsertPodcastMutation,
	UpdatePodcastTranscriptionMutation,
	DeletePodcastMutation,
	UpdatePodcastMutation
} from '$lib/graphql/generated/graphql';
import type { StoreResult } from '$lib/types/todo';

type Podcast = GetPodcastsQuery['podcasts'][number];

const apiEndpoint = PUBLIC_API_ENV === 'production' ? PUBLIC_API_ENDPOINT : PUBLIC_API_ENDPOINT_DEV;
// Derive REST base by stripping /v1/graphql
const apiBase = apiEndpoint.replace('/v1/graphql', '');
const PODCASTS_REST_URL = `${apiBase}/api/rest/podcasts`;

/** Direct unauthenticated GraphQL request using Hasura anonymous role */
async function anonymousRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
	console.log('[PodcastsStore] anonymousRequest to', apiEndpoint);
	const res = await fetch(apiEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, variables })
	});
	if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
	const json = await res.json();
	if (json.errors?.length) throw new Error(json.errors[0].message);
	return json.data as T;
}

export type TranscriptionProgressStep = 'downloading' | 'splitting' | 'chunks_found' | 'transcribing' | 'polishing' | 'idle';

interface PodcastsState {
	podcasts: Podcast[];
	loading: boolean;
	transcribing: boolean;
	transcriptionProgress: TranscriptionProgressStep;
	transcriptionStatus: { current?: number; total?: number; count?: number } | null;
	error: string | null;
}

function createPodcastsStore() {
	const state = $state<PodcastsState>({
		podcasts: [],
		loading: false,
		transcribing: false,
		transcriptionProgress: 'idle',
		transcriptionStatus: null,
		error: null
	});

	/**
	 * Load all podcasts via the public REST endpoint — works without auth.
	 */
	async function loadPodcasts(): Promise<void> {
		if (!browser) return;
		state.loading = true;
		state.error = null;
		try {
			const res = await fetch(PODCASTS_REST_URL);
			if (!res.ok) throw new Error(`HTTP ${res.status} from ${PODCASTS_REST_URL}`);
			const data: { podcasts: Podcast[] } = await res.json();
			state.podcasts = data.podcasts || [];
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error loading podcasts';
			state.error = msg;
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Insert a new podcast.
	 */
	async function insertPodcast(
		object: {
			podcast_name: string;
			url: string;
			title?: string;
			description?: string;
			date?: string;
			transcription_md?: string;
		},
		isAuthenticated: boolean
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		try {
			let podcast: Podcast | null = null;

			if (isAuthenticated) {
				const data = (await request(INSERT_PODCAST, { object })) as InsertPodcastMutation;
				podcast = data.insert_podcasts_one ?? null;
			} else {
				const INSERT_QUERY = `
					mutation InsertPodcastAnon($object: podcasts_insert_input!) {
						insert_podcasts_one(object: $object) {
							id podcast_name url title description date transcription_md created_at
							user { id username }
						}
					}
				`;
				const data = await anonymousRequest<InsertPodcastMutation>(INSERT_QUERY, { object });
				podcast = data.insert_podcasts_one ?? null;
			}

			if (podcast) {
				state.podcasts = [podcast, ...state.podcasts];
				return { success: true, message: 'Podcast added', data: podcast };
			}
			return { success: false, message: 'Failed to insert podcast' };
		} catch (e) {
			return { success: false, message: e instanceof Error ? e.message : 'Error inserting podcast' };
		}
	}

	/**
	 * Update an existing podcast's metadata.
	 */
	async function updatePodcast(
		id: string,
		updates: {
			podcast_name?: string;
			title?: string;
			description?: string;
			date?: string;
		}
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		try {
			const data = (await request(UPDATE_PODCAST, { id, ...updates })) as UpdatePodcastMutation;
			const updated = data.update_podcasts_by_pk;
			if (updated) {
				state.podcasts = state.podcasts.map((p) =>
					p.id === id ? { ...p, ...updated } : p
				);
				return { success: true, message: 'Podcast updated', data: updated };
			}
			return { success: false, message: 'Podcast not found' };
		} catch (e) {
			return { success: false, message: e instanceof Error ? e.message : 'Update failed' };
		}
	}

	/**
	 * Delete a podcast.
	 */
	async function deletePodcast(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		try {
			const data = (await request(DELETE_PODCAST, { id })) as DeletePodcastMutation;
			if (data.delete_podcasts_by_pk) {
				state.podcasts = state.podcasts.filter((p) => p.id !== id);
				return { success: true, message: 'Podcast deleted' };
			}
			return { success: false, message: 'Podcast not found' };
		} catch (e) {
			return { success: false, message: e instanceof Error ? e.message : 'Delete failed' };
		}
	}

	/**
	 * Call the server-side transcription API (streaming NDJSON), then persist the result.
	 */
	async function transcribeAndSave(
		podcastId: string,
		audioUrl: string,
		groqApiKey: string,
		language: string = 'en'
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.transcribing = true;
		state.transcriptionProgress = 'idle';
		state.transcriptionStatus = null;
		
		try {
			const res = await fetch('/api/transcribe-podcast', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ audioUrl, groqApiKey, language })
			});

			if (!res.ok) {
				return { success: false, message: 'Server error' };
			}

			const reader = res.body?.getReader();
			if (!reader) throw new Error('No reader available');

			const decoder = new TextDecoder();
			let transcription_md = '';
			let buffer = '';

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim()) continue;
					const data = JSON.parse(line);
					
					if (data.error) throw new Error(data.error);
					
					if (data.step) {
						state.transcriptionProgress = data.step;
						state.transcriptionStatus = { 
							current: data.current, 
							total: data.total, 
							count: data.count 
						};
					}
					
					if (data.success) {
						transcription_md = data.transcription_md;
					}
				}
			}

			if (!transcription_md) throw new Error('Transcription failed or empty result');

			const updateData = (await request(UPDATE_PODCAST_TRANSCRIPTION, {
				id: podcastId,
				transcription_md
			})) as UpdatePodcastTranscriptionMutation;

			if (updateData.update_podcasts_by_pk) {
				state.podcasts = state.podcasts.map((p) =>
					p.id === podcastId ? { ...p, transcription_md } : p
				);
				return { success: true, message: 'Transcription saved', data: { transcription_md } };
			}
			return { success: false, message: 'Failed to save transcription' };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Transcription error';
			return { success: false, message };
		} finally {
			state.transcribing = false;
			state.transcriptionProgress = 'idle';
			state.transcriptionStatus = null;
		}
	}

	return {
		get podcasts() { return state.podcasts; },
		get loading() { return state.loading; },
		get transcribing() { return state.transcribing; },
		get transcriptionProgress() { return state.transcriptionProgress; },
		get transcriptionStatus() { return state.transcriptionStatus; },
		get error() { return state.error; },
		loadPodcasts,
		insertPodcast,
		updatePodcast,
		deletePodcast,
		transcribeAndSave
	};
}

export const podcastsStore = createPodcastsStore();
