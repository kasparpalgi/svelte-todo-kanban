/** @file chrome-extension/lib/api.js */

/**
 * ToDzz data API client: POST /api/data/<op> with the token /extension-auth gave us.
 * Replaced direct Hasura GraphQL (todzz#231). Uses getApiUrl() and getToken() from auth.js.
 */

/**
 * Run one data op.
 * @param {string} op - Op name: getBoards, getNotes or createNote
 * @param {Object} input - The op's JSON input
 * @returns {Promise<any>} The op's data
 */
async function callOp(op, input = {}) {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/api/data/${op}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) await logout();
    throw new Error(result.error || `HTTP error! status: ${response.status}`);
  }
  return result.data;
}

/**
 * Fetch the user's boards
 * @returns {Promise<Array>} Array of boards
 */
async function getBoards() {
  return (await callOp('getBoards')) || [];
}

/**
 * Create a new note
 * @param {Object} noteData - Note data
 * @param {string} noteData.board_id - Board ID
 * @param {string} noteData.title - Note title
 * @param {string} noteData.content - Note content (HTML)
 * @param {string} [noteData.cover_image_url] - Cover image URL (optional)
 * @returns {Promise<Object>} Created note
 */
async function createNote(noteData) {
  return callOp('createNote', {
    boardId: noteData.board_id,
    title: noteData.title,
    content: noteData.content,
    cover_image_url: noteData.cover_image_url ?? null
  });
}

/**
 * Get a board's notes
 * @param {string} boardId - Board ID
 * @returns {Promise<Array>} Array of notes
 */
async function getNotes(boardId) {
  return (await callOp('getNotes', { boardId })) || [];
}
