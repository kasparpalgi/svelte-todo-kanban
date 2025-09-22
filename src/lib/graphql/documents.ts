/** @file src/lib/graphql/documents.ts */
import { graphql } from './generated';

export const TODO_FRAGMENT = graphql(`
	fragment TodoFields on todos {
		id
		title
		content
		due_on
		sort_order
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

export const USER_FRAGMENT = graphql(`
	fragment UserFields on users {
		id
		name
		image
		email
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
