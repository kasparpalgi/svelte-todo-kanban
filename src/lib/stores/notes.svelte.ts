/** @file src/lib/stores/notes.svelte.ts */
import { request } from '$lib/graphql/client';
import { browser } from '$app/environment';
import type { StoreResult } from '$lib/types/todo';

// Temporary raw GraphQL queries until npm run generate is executed
// TODO: Replace with imports from $lib/graphql/documents after running npm run generate
const GET_NOTES = `
	query GetNotes($where: notes_bool_exp = {}, $order_by: [notes_order_by!] = { sort_order: asc, created_at: desc }, $limit: Int = 100, $offset: Int = 0) {
		notes(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			id
			board_id
			user_id
			title
			content
			sort_order
			created_at
			updated_at
			user {
				id
				name
				username
				image
				email
			}
			board {
				id
				name
				alias
			}
		}
	}
`;

const CREATE_NOTE = `
	mutation CreateNote($objects: [notes_insert_input!]!) {
		insert_notes(objects: $objects) {
			returning {
				id
				board_id
				user_id
				title
				content
				sort_order
				created_at
				updated_at
				user {
					id
					name
					username
					image
					email
				}
				board {
					id
					name
					alias
				}
			}
		}
	}
`;

const UPDATE_NOTE = `
	mutation UpdateNote($where: notes_bool_exp!, $_set: notes_set_input!) {
		update_notes(where: $where, _set: $_set) {
			affected_rows
			returning {
				id
				board_id
				user_id
				title
				content
				sort_order
				created_at
				updated_at
				user {
					id
					name
					username
					image
					email
				}
				board {
					id
					name
					alias
				}
			}
		}
	}
`;

const UPDATE_NOTES = `
	mutation UpdateNotes($updates: [notes_updates!]!) {
		update_notes_many(updates: $updates) {
			affected_rows
			returning {
				id
				board_id
				user_id
				title
				content
				sort_order
				created_at
				updated_at
				user {
					id
					name
					username
					image
					email
				}
				board {
					id
					name
					alias
				}
			}
		}
	}
`;

const DELETE_NOTE = `
	mutation DeleteNote($where: notes_bool_exp!) {
		delete_notes(where: $where) {
			affected_rows
		}
	}
`;

// Temporary types until GraphQL codegen runs
// These will be replaced by generated types from $lib/graphql/generated/graphql
type NoteFieldsFragment = {
	id: string;
	board_id: string;
	user_id: string;
	title: string;
	content: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
	user?: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
		email: string | null;
	};
	board?: {
		id: string;
		name: string;
		alias: string | null;
	};
};

type GetNotesQuery = {
	notes: NoteFieldsFragment[];
};

type CreateNoteMutation = {
	insert_notes?: {
		returning: NoteFieldsFragment[];
	};
};

type UpdateNoteMutation = {
	update_notes?: {
		affected_rows: number;
		returning: NoteFieldsFragment[];
	};
};

type UpdateNotesMutation = {
	update_notes_many?: Array<{
		affected_rows: number;
		returning: NoteFieldsFragment[];
	}>;
};

type DeleteNoteMutation = {
	delete_notes?: {
		affected_rows: number;
	};
};

interface NotesState {
	notes: NoteFieldsFragment[];
	loading: boolean;
	error: string | null;
	currentBoardId: string | null;
}

function createNotesStore() {
	const state = $state<NotesState>({
		notes: [],
		loading: false,
		error: null,
		currentBoardId: null
	});

	// Derived sorted notes
	const sortedNotes = $derived(
		[...state.notes].sort((a, b) => {
			// Sort by sort_order first, then by created_at (newest first)
			if (a.sort_order !== b.sort_order) {
				return a.sort_order - b.sort_order;
			}
			return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
		})
	);

	async function loadNotes(boardId: string): Promise<NoteFieldsFragment[]> {
		console.log('[NotesStore.loadNotes] Called, boardId:', boardId);
		if (!browser) {
			console.log('[NotesStore.loadNotes] Not in browser');
			return [];
		}

		state.loading = true;
		state.error = null;
		state.currentBoardId = boardId;

		try {
			console.log('[NotesStore.loadNotes] Fetching from API...');
			const data = await request(GET_NOTES, {
				where: { board_id: { _eq: boardId } },
				order_by: [{ sort_order: 'asc' }, { created_at: 'desc' }],
				limit: 1000,
				offset: 0
			}) as GetNotesQuery;

			console.log('[NotesStore.loadNotes] Received notes:', data.notes?.length || 0);
			state.notes = data.notes || [];
			return state.notes;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading notes';
			state.error = message;
			console.error('[NotesStore.loadNotes] Error:', error);
			return [];
		} finally {
			state.loading = false;
		}
	}

	async function createNote(
		boardId: string,
		title: string = 'Untitled Note',
		content: string = ''
	): Promise<StoreResult> {
		if (!browser) {
			return { success: false, message: 'Not in browser' };
		}

		try {
			// Calculate next sort_order
			const maxSortOrder = state.notes.reduce((max, note) => Math.max(max, note.sort_order), 0);

			const data = await request(CREATE_NOTE, {
				objects: [
					{
						board_id: boardId,
						title: title.trim() || 'Untitled Note',
						content: content.trim() || null,
						sort_order: maxSortOrder + 1
					}
				]
			}) as CreateNoteMutation;

			const newNote = data.insert_notes?.returning?.[0];

			if (newNote) {
				state.notes = [...state.notes, newNote];
				return {
					success: true,
					message: 'Note created successfully',
					data: newNote
				};
			}

			return { success: false, message: 'Failed to create note' };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error creating note';
			console.error('[NotesStore.createNote] Error:', error);
			return { success: false, message };
		}
	}

	async function updateNote(
		id: string,
		updates: { title?: string; content?: string }
	): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const noteIndex = state.notes.findIndex((n) => n.id === id);
		if (noteIndex === -1) return { success: false, message: 'Note not found' };

		const originalNote = { ...state.notes[noteIndex] };

		// Optimistic update
		state.notes[noteIndex] = {
			...state.notes[noteIndex],
			...(updates.title !== undefined && { title: updates.title }),
			...(updates.content !== undefined && { content: updates.content })
		};

		try {
			const _set: any = {};
			if (updates.title !== undefined) _set.title = updates.title.trim() || 'Untitled Note';
			if (updates.content !== undefined) _set.content = updates.content.trim() || null;

			const data = await request(UPDATE_NOTE, {
				where: { id: { _eq: id } },
				_set
			}) as UpdateNoteMutation;

			const updatedNote = data.update_notes?.returning?.[0];
			if (updatedNote) {
				state.notes[noteIndex] = updatedNote;
				return {
					success: true,
					message: 'Note updated successfully',
					data: updatedNote
				};
			} else {
				state.notes[noteIndex] = originalNote;
				return { success: false, message: 'Failed to update note' };
			}
		} catch (error) {
			state.notes[noteIndex] = originalNote;
			const message = error instanceof Error ? error.message : 'Error updating note';
			console.error('[NotesStore.updateNote] Error:', error);
			return { success: false, message };
		}
	}

	async function deleteNote(id: string): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const noteIndex = state.notes.findIndex((n) => n.id === id);
		if (noteIndex === -1) return { success: false, message: 'Note not found' };

		const originalNotes = [...state.notes];

		// Optimistic delete
		state.notes = state.notes.filter((n) => n.id !== id);

		try {
			const data = await request(DELETE_NOTE, {
				where: { id: { _eq: id } }
			}) as DeleteNoteMutation;

			if (data.delete_notes?.affected_rows && data.delete_notes.affected_rows > 0) {
				return { success: true, message: 'Note deleted successfully' };
			}

			state.notes = originalNotes;
			return { success: false, message: 'Failed to delete note' };
		} catch (error) {
			state.notes = originalNotes;
			const message = error instanceof Error ? error.message : 'Error deleting note';
			console.error('[NotesStore.deleteNote] Error:', error);
			return { success: false, message };
		}
	}

	async function reorderNotes(noteIds: string[]): Promise<StoreResult> {
		if (!browser) return { success: false, message: 'Not in browser' };

		const originalNotes = [...state.notes];

		// Optimistic update: reorder notes in state
		const reorderedNotes = noteIds
			.map((id, index) => {
				const note = state.notes.find((n) => n.id === id);
				if (note) {
					return { ...note, sort_order: index };
				}
				return null;
			})
			.filter((n): n is NoteFieldsFragment => n !== null);

		state.notes = reorderedNotes;

		try {
			// Prepare batch update
			const updates = noteIds.map((id, index) => ({
				where: { id: { _eq: id } },
				_set: { sort_order: index }
			}));

			const data = await request(UPDATE_NOTES, {
				updates
			}) as UpdateNotesMutation;

			if (data.update_notes_many) {
				// Flatten all returned notes
				const updatedNotes = data.update_notes_many.flatMap(
					(result) => result.returning || []
				);

				if (updatedNotes.length > 0) {
					// Update state with server response
					state.notes = state.notes.map((note) => {
						const updated = updatedNotes.find((n) => n.id === note.id);
						return updated || note;
					});

					return {
						success: true,
						message: 'Notes reordered successfully'
					};
				}
			}

			state.notes = originalNotes;
			return { success: false, message: 'Failed to reorder notes' };
		} catch (error) {
			state.notes = originalNotes;
			const message = error instanceof Error ? error.message : 'Error reordering notes';
			console.error('[NotesStore.reorderNotes] Error:', error);
			return { success: false, message };
		}
	}

	return {
		get notes() {
			return state.notes;
		},
		get sortedNotes() {
			return sortedNotes;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get currentBoardId() {
			return state.currentBoardId;
		},

		loadNotes,
		createNote,
		updateNote,
		deleteNote,
		reorderNotes,

		clearError: () => {
			state.error = null;
		},
		reset: () => {
			state.notes = [];
			state.loading = false;
			state.error = null;
			state.currentBoardId = null;
		}
	};
}

export const notesStore = createNotesStore();
