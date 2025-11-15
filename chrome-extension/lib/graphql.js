/** @file chrome-extension/lib/graphql.js */

/**
 * GraphQL client for ToDzz Chrome Extension
 * Handles GraphQL queries and mutations
 */

const GRAPHQL_ENDPOINT = 'https://www.todzz.eu/v1/graphql';
const GRAPHQL_ENDPOINT_DEV = 'http://localhost:3001/v1/graphql';

/**
 * Get GraphQL endpoint based on environment
 * @returns {Promise<string>} GraphQL endpoint URL
 */
async function getGraphQLEndpoint() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['devMode'], (result) => {
      resolve(result.devMode ? GRAPHQL_ENDPOINT_DEV : GRAPHQL_ENDPOINT);
    });
  });
}

/**
 * Execute a GraphQL query or mutation
 * @param {string} query - GraphQL query/mutation
 * @param {Object} variables - Query variables
 * @param {string} token - JWT token
 * @returns {Promise<Object>} GraphQL response data
 */
async function request(query, variables = {}, token = null) {
  const endpoint = await getGraphQLEndpoint();

  // Get token from storage if not provided
  if (!token) {
    token = await new Promise((resolve) => {
      chrome.storage.local.get(['jwtToken'], (result) => {
        resolve(result.jwtToken);
      });
    });
  }

  if (!token) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || 'GraphQL error';
      throw new Error(errorMessage);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}

/**
 * GraphQL Queries and Mutations
 */

// Get user's boards
const GET_BOARDS_QUERY = `
  query GetBoards {
    boards(order_by: { sort_order: asc }) {
      id
      name
      alias
      user_id
      sort_order
    }
  }
`;

/**
 * Fetch user's boards
 * @returns {Promise<Array>} Array of boards
 */
async function getBoards() {
  const data = await request(GET_BOARDS_QUERY);
  return data.boards || [];
}

// Create note mutation
const CREATE_NOTE_MUTATION = `
  mutation CreateNote($objects: [notes_insert_input!]!) {
    insert_notes(objects: $objects) {
      returning {
        id
        board_id
        user_id
        title
        content
        cover_image_url
        sort_order
        created_at
        updated_at
      }
    }
  }
`;

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
  const variables = {
    objects: [noteData]
  };

  const data = await request(CREATE_NOTE_MUTATION, variables);

  if (!data.insert_notes?.returning?.[0]) {
    throw new Error('Failed to create note');
  }

  return data.insert_notes.returning[0];
}

// Get notes for a board
const GET_NOTES_QUERY = `
  query GetNotes($where: notes_bool_exp, $limit: Int, $offset: Int) {
    notes(
      where: $where
      order_by: { sort_order: asc, created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      board_id
      user_id
      title
      content
      cover_image_url
      sort_order
      created_at
      updated_at
    }
  }
`;

/**
 * Get notes for a board
 * @param {string} boardId - Board ID
 * @param {number} limit - Limit
 * @param {number} offset - Offset
 * @returns {Promise<Array>} Array of notes
 */
async function getNotes(boardId, limit = 50, offset = 0) {
  const variables = {
    where: { board_id: { _eq: boardId } },
    limit,
    offset
  };

  const data = await request(GET_NOTES_QUERY, variables);
  return data.notes || [];
}
