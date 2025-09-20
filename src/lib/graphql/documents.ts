// @file src/lib/graphql/documents.ts
import { gql } from 'graphql-request';

export const GET_TODOS = gql`
	query Todos(
		$where: todos_bool_exp = {}
		$order_by: [todos_order_by!] = { due_on: desc, updated_at: desc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		todos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			id
			title
			content
			due_on
			sort_order
			completed_at
			list {
				id
				name
			}
			created_at
			updated_at
		}
	}
`;

export const CREATE_TODO = gql`
	mutation CreateTodo($objects: [todos_insert_input!] = {}) {
		insert_todos(objects: $objects) {
			returning {
				id
				title
				content
				due_on
				sort_order
				completed_at
				list {
					id
					name
				}
				created_at
				updated_at
			}
		}
	}
`;

export const UPDATE_TODOS = gql`
	mutation UpdateTodos($where: todos_bool_exp = {}, $_set: todos_set_input = {}) {
		update_todos(where: $where, _set: $_set) {
			affected_rows
		}
	}
`;

export const DELETE_TODOS = gql`
	mutation DeleteTodos($where: todos_bool_exp = {}) {
		delete_todos(where: $where) {
			affected_rows
		}
	}
`;

export const GET_USERS = gql`
	query Users(
		$where: users_bool_exp = {}
		$order_by: [users_order_by!] = {}
		$limit: Int = 100
		$offset: Int = 0
	) {
		users(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			id
			name
			image
			email
			emailVerified
			created_at
			updated_at
		}
	}
`;
