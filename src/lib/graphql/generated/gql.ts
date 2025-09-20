/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n\tquery Todos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tdue_on\n\t\t\tsort_order\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n": typeof types.TodosDocument,
    "\n\tmutation CreateTodo($objects: [todos_insert_input!] = {}) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\ttitle\n\t\t\t\tcontent\n\t\t\t\tdue_on\n\t\t\t\tsort_order\n\t\t\t\tcompleted_at\n\t\t\t\tlist {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tcreated_at\n\t\t\t\tupdated_at\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateTodoDocument,
    "\n\tmutation UpdateTodos($where: todos_bool_exp = {}, $_set: todos_set_input = {}) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.UpdateTodosDocument,
    "\n\tmutation DeleteTodos($where: todos_bool_exp = {}) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteTodosDocument,
    "\n\tquery Users(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\tname\n\t\t\timage\n\t\t\temail\n\t\t\temailVerified\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n": typeof types.UsersDocument,
};
const documents: Documents = {
    "\n\tquery Todos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tdue_on\n\t\t\tsort_order\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n": types.TodosDocument,
    "\n\tmutation CreateTodo($objects: [todos_insert_input!] = {}) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\ttitle\n\t\t\t\tcontent\n\t\t\t\tdue_on\n\t\t\t\tsort_order\n\t\t\t\tcompleted_at\n\t\t\t\tlist {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tcreated_at\n\t\t\t\tupdated_at\n\t\t\t}\n\t\t}\n\t}\n": types.CreateTodoDocument,
    "\n\tmutation UpdateTodos($where: todos_bool_exp = {}, $_set: todos_set_input = {}) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.UpdateTodosDocument,
    "\n\tmutation DeleteTodos($where: todos_bool_exp = {}) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteTodosDocument,
    "\n\tquery Users(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\tname\n\t\t\timage\n\t\t\temail\n\t\t\temailVerified\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n": types.UsersDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery Todos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tdue_on\n\t\t\tsort_order\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery Todos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tdue_on\n\t\t\tsort_order\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateTodo($objects: [todos_insert_input!] = {}) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\ttitle\n\t\t\t\tcontent\n\t\t\t\tdue_on\n\t\t\t\tsort_order\n\t\t\t\tcompleted_at\n\t\t\t\tlist {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tcreated_at\n\t\t\t\tupdated_at\n\t\t\t}\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation CreateTodo($objects: [todos_insert_input!] = {}) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\ttitle\n\t\t\t\tcontent\n\t\t\t\tdue_on\n\t\t\t\tsort_order\n\t\t\t\tcompleted_at\n\t\t\t\tlist {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t\tcreated_at\n\t\t\t\tupdated_at\n\t\t\t}\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateTodos($where: todos_bool_exp = {}, $_set: todos_set_input = {}) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation UpdateTodos($where: todos_bool_exp = {}, $_set: todos_set_input = {}) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteTodos($where: todos_bool_exp = {}) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation DeleteTodos($where: todos_bool_exp = {}) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery Users(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\tname\n\t\t\timage\n\t\t\temail\n\t\t\temailVerified\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery Users(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\tname\n\t\t\timage\n\t\t\temail\n\t\t\temailVerified\n\t\t\tcreated_at\n\t\t\tupdated_at\n\t\t}\n\t}\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;