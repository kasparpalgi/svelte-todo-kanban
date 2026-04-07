/** @file src/lib/stores/podcasts.svelte.ts */
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import { PUBLIC_API_ENDPOINT, PUBLIC_API_ENDPOINT_DEV, PUBLIC_API_ENV } from '$env/static/public';
import {
	INSERT_PODCAST,
	UPDATE_PODCAST_TRANSCRIPTION
} from '$lib/graphql/documents';
import type {
	GetPodcastsQuery,
	InsertPodcastMutation,
	UpdatePodcastTranscriptionMutation
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

interface PodcastsState {
	podcasts: Podcast[];
	loading: boolean;
	transcribing: boolean;
	error: string | null;
}

function createPodcastsStore() {
	const state = $state<PodcastsState>({
		podcasts: [],
		loading: false,
		transcribing: false,
		error: null
	});

	/**
	 * Load all podcasts via the public REST endpoint — works without auth.
	 */
	async function loadPodcasts(): Promise<void> {
		if (!browser) return;
		state.loading = true;
		state.error = null;
		console.log('[PodcastsStore] loadPodcasts → REST:', PODCASTS_REST_URL);
		try {
			const res = await fetch(PODCASTS_REST_URL);
			console.log('[PodcastsStore] loadPodcasts response status:', res.status);
			if (!res.ok) throw new Error(`HTTP ${res.status} from ${PODCASTS_REST_URL}`);
			const data: { podcasts: Podcast[] } = await res.json();
			state.podcasts = data.podcasts || [];
			console.log('[PodcastsStore] loadPodcasts success:', state.podcasts.length, 'podcasts');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error loading podcasts';
			console.error('[PodcastsStore] loadPodcasts FAILED:', msg);
			state.error = msg;
		} finally {
			state.loading = false;
		}
	}

	/**
	 * Insert a new podcast.
	 * - When authenticated: uses JWT request so Hasura auto-sets user_id from session.
	 * - When not authenticated (guest): uses anonymous GraphQL request with user_id = null.
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

		console.log('[PodcastsStore] insertPodcast, isAuthenticated:', isAuthenticated);

		try {
			let podcast: Podcast | null = null;

			if (isAuthenticated) {
				// Hasura `user` role auto-sets user_id from JWT via `set` constraint
				console.log('[PodcastsStore] insertPodcast via authenticated request');
				const data = (await request(INSERT_PODCAST, { object })) as InsertPodcastMutation;
				podcast = data.insert_podcasts_one ?? null;
			} else {
				// Anonymous: no user_id
				console.log('[PodcastsStore] insertPodcast via anonymous request');
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
				console.log('[PodcastsStore] insertPodcast success:', podcast.id);
				return { success: true, message: 'Podcast added', data: podcast };
			}
			return { success: false, message: 'Failed to insert podcast' };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Error inserting podcast';
			console.error('[PodcastsStore] insertPodcast FAILED:', message);
			return { success: false, message };
		}
	}

	/**
	 * Call the server-side transcription API, then persist the result via authenticated GraphQL.
	 */
	async function transcribeAndSave(
		podcastId: string,
		audioUrl: string,
		groqApiKey: string
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };
		state.transcribing = true;
		console.log('[PodcastsStore] transcribeAndSave start:', podcastId, audioUrl);
		try {
			const res = await fetch('/api/transcribe-podcast', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ audioUrl, groqApiKey })
			});
			console.log('[PodcastsStore] transcribeAndSave API response status:', res.status);
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				console.error('[PodcastsStore] transcribeAndSave API error:', err);
				return { success: false, message: (err as any).error || 'Transcription failed' };
			}
			const { transcription_md } = await res.json();
			console.log('[PodcastsStore] transcription received, chars:', transcription_md?.length);

			const updateData = (await request(UPDATE_PODCAST_TRANSCRIPTION, {
				id: podcastId,
				transcription_md
			})) as UpdatePodcastTranscriptionMutation;

			if (updateData.update_podcasts_by_pk) {
				state.podcasts = state.podcasts.map((p) =>
					p.id === podcastId ? { ...p, transcription_md } : p
				);
				console.log('[PodcastsStore] transcription saved for:', podcastId);
				return { success: true, message: 'Transcription saved', data: { transcription_md } };
			}
			return { success: false, message: 'Failed to save transcription' };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Transcription error';
			console.error('[PodcastsStore] transcribeAndSave FAILED:', message);
			return { success: false, message };
		} finally {
			state.transcribing = false;
		}
	}

	return {
		get podcasts() {
			return state.podcasts;
		},
		get loading() {
			return state.loading;
		},
		get transcribing() {
			return state.transcribing;
		},
		get error() {
			return state.error;
		},
		loadPodcasts,
		insertPodcast,
		transcribeAndSave
	};
}

export const podcastsStore = createPodcastsStore();
