/** @file src/lib/graphql/documents.ts */
import { graphql } from './generated';

export const TODO_FRAGMENT = graphql(`
	fragment TodoFields on todos {
		id
		title
		content
		due_on
		sort_order
		priority
		list_id
		completed_at
		created_at
		updated_at
		uploads {
			id
			url
			created_at
		}
		list {
			id
			name
			sort_order
			board {
				id
				name
				sort_order
			}
		}
	}
`);

export const LIST_FRAGMENT = graphql(`
	fragment ListFields on lists {
		id
		name
		sort_order
		board_id
		created_at
		updated_at
		board {
			id
			name
			sort_order
		}
	}
`);

export const BOARD_FRAGMENT = graphql(`
	fragment BoardFields on boards {
		id
		name
		sort_order
		created_at
		updated_at
	}
`);

export const USER_FRAGMENT = graphql(`
	fragment UserFields on users {
		id
		name
		image
		email
		locale
		dark_mode
		settings
		emailVerified
		created_at
		updated_at
	}
`);

export const GET_TODOS = graphql(`
	query GetTodos(
		$where: todos_bool_exp = {}
		$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		todos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...TodoFields
		}
	}
`);

export const GET_LISTS = graphql(`
	query GetLists(
		$where: lists_bool_exp = {}
		$order_by: [lists_order_by!] = { sort_order: asc, name: asc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		lists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...ListFields
		}
	}
`);

export const GET_BOARDS = graphql(`
	query GetBoards(
		$where: boards_bool_exp = {}
		$order_by: [boards_order_by!] = { sort_order: asc, name: asc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		boards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...BoardFields
		}
	}
`);

export const CREATE_TODO = graphql(`
	mutation CreateTodo($objects: [todos_insert_input!]!) {
		insert_todos(objects: $objects) {
			returning {
				...TodoFields
			}
		}
	}
`);

export const UPDATE_TODOS = graphql(`
	mutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {
		update_todos(where: $where, _set: $_set) {
			affected_rows
			returning {
				...TodoFields
			}
		}
	}
`);

export const DELETE_TODOS = graphql(`
	mutation DeleteTodos($where: todos_bool_exp!) {
		delete_todos(where: $where) {
			affected_rows
		}
	}
`);

export const CREATE_LIST = graphql(`
	mutation CreateList($objects: [lists_insert_input!]!) {
		insert_lists(objects: $objects) {
			returning {
				...ListFields
			}
		}
	}
`);

export const UPDATE_LIST = graphql(`
	mutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {
		update_lists(where: $where, _set: $_set) {
			affected_rows
			returning {
				...ListFields
			}
		}
	}
`);

export const DELETE_LIST = graphql(`
	mutation DeleteList($where: lists_bool_exp!) {
		delete_lists(where: $where) {
			affected_rows
		}
	}
`);

export const CREATE_BOARD = graphql(`
	mutation CreateBoard($objects: [boards_insert_input!]!) {
		insert_boards(objects: $objects) {
			returning {
				...BoardFields
			}
		}
	}
`);

export const UPDATE_BOARD = graphql(`
	mutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {
		update_boards(where: $where, _set: $_set) {
			affected_rows
			returning {
				...BoardFields
			}
		}
	}
`);

export const DELETE_BOARD = graphql(`
	mutation DeleteBoard($where: boards_bool_exp!) {
		delete_boards(where: $where) {
			affected_rows
		}
	}
`);

export const CREATE_UPLOAD = graphql(`
	mutation CreateUpload($objects: [uploads_insert_input!]!) {
		insert_uploads(objects: $objects) {
			returning {
				id
				url
				todo_id
				created_at
			}
		}
	}
`);

export const DELETE_UPLOAD = graphql(`
	mutation DeleteUpload($where: uploads_bool_exp!) {
		delete_uploads(where: $where) {
			affected_rows
		}
	}
`);

export const GET_USERS = graphql(`
	query GetUsers(
		$where: users_bool_exp = {}
		$order_by: [users_order_by!] = {}
		$limit: Int = 100
		$offset: Int = 0
	) {
		users(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...UserFields
		}
	}
`);

export const UPDATE_USER = graphql(`
	mutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {
		update_users(where: $where, _set: $_set) {
			affected_rows
			returning {
				...UserFields
			}
		}
	}
`);
