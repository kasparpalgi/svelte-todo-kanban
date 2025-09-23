/* eslint-disable */
import * as types from './graphql';



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
    "\n\tfragment TodoFields on todos {\n\t\tid\n\t\ttitle\n\t\tcontent\n\t\tdue_on\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsort_order\n\t\t\t}\n\t\t}\n\t}\n": typeof types.TodoFieldsFragmentDoc,
    "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t}\n\t}\n": typeof types.ListFieldsFragmentDoc,
    "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.BoardFieldsFragmentDoc,
    "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\timage\n\t\temail\n\t\temailVerified\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.UserFieldsFragmentDoc,
    "\n\tquery GetTodos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...TodoFields\n\t\t}\n\t}\n": typeof types.GetTodosDocument,
    "\n\tquery GetLists(\n\t\t$where: lists_bool_exp = {}\n\t\t$order_by: [lists_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tlists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ListFields\n\t\t}\n\t}\n": typeof types.GetListsDocument,
    "\n\tquery GetBoards(\n\t\t$where: boards_bool_exp = {}\n\t\t$order_by: [boards_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardFields\n\t\t}\n\t}\n": typeof types.GetBoardsDocument,
    "\n\tmutation CreateTodo($objects: [todos_insert_input!]!) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...TodoFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateTodoDocument,
    "\n\tmutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...TodoFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateTodosDocument,
    "\n\tmutation DeleteTodos($where: todos_bool_exp!) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteTodosDocument,
    "\n\tmutation CreateList($objects: [lists_insert_input!]!) {\n\t\tinsert_lists(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateListDocument,
    "\n\tmutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {\n\t\tupdate_lists(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateListDocument,
    "\n\tmutation DeleteList($where: lists_bool_exp!) {\n\t\tdelete_lists(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteListDocument,
    "\n\tmutation CreateBoard($objects: [boards_insert_input!]!) {\n\t\tinsert_boards(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateBoardDocument,
    "\n\tmutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {\n\t\tupdate_boards(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateBoardDocument,
    "\n\tmutation DeleteBoard($where: boards_bool_exp!) {\n\t\tdelete_boards(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteBoardDocument,
    "\n\tmutation CreateUpload($objects: [uploads_insert_input!]!) {\n\t\tinsert_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\ttodo_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateUploadDocument,
    "\n\tmutation DeleteUpload($where: uploads_bool_exp!) {\n\t\tdelete_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteUploadDocument,
    "\n\tquery GetUsers(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...UserFields\n\t\t}\n\t}\n": typeof types.GetUsersDocument,
};
const documents: Documents = {
    "\n\tfragment TodoFields on todos {\n\t\tid\n\t\ttitle\n\t\tcontent\n\t\tdue_on\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsort_order\n\t\t\t}\n\t\t}\n\t}\n": types.TodoFieldsFragmentDoc,
    "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t}\n\t}\n": types.ListFieldsFragmentDoc,
    "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.BoardFieldsFragmentDoc,
    "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\timage\n\t\temail\n\t\temailVerified\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.UserFieldsFragmentDoc,
    "\n\tquery GetTodos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...TodoFields\n\t\t}\n\t}\n": types.GetTodosDocument,
    "\n\tquery GetLists(\n\t\t$where: lists_bool_exp = {}\n\t\t$order_by: [lists_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tlists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ListFields\n\t\t}\n\t}\n": types.GetListsDocument,
    "\n\tquery GetBoards(\n\t\t$where: boards_bool_exp = {}\n\t\t$order_by: [boards_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardFields\n\t\t}\n\t}\n": types.GetBoardsDocument,
    "\n\tmutation CreateTodo($objects: [todos_insert_input!]!) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...TodoFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateTodoDocument,
    "\n\tmutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...TodoFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateTodosDocument,
    "\n\tmutation DeleteTodos($where: todos_bool_exp!) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteTodosDocument,
    "\n\tmutation CreateList($objects: [lists_insert_input!]!) {\n\t\tinsert_lists(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateListDocument,
    "\n\tmutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {\n\t\tupdate_lists(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateListDocument,
    "\n\tmutation DeleteList($where: lists_bool_exp!) {\n\t\tdelete_lists(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteListDocument,
    "\n\tmutation CreateBoard($objects: [boards_insert_input!]!) {\n\t\tinsert_boards(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateBoardDocument,
    "\n\tmutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {\n\t\tupdate_boards(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateBoardDocument,
    "\n\tmutation DeleteBoard($where: boards_bool_exp!) {\n\t\tdelete_boards(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteBoardDocument,
    "\n\tmutation CreateUpload($objects: [uploads_insert_input!]!) {\n\t\tinsert_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\ttodo_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n": types.CreateUploadDocument,
    "\n\tmutation DeleteUpload($where: uploads_bool_exp!) {\n\t\tdelete_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteUploadDocument,
    "\n\tquery GetUsers(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...UserFields\n\t\t}\n\t}\n": types.GetUsersDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment TodoFields on todos {\n\t\tid\n\t\ttitle\n\t\tcontent\n\t\tdue_on\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tsort_order\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').TodoFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t}\n\t}\n"): typeof import('./graphql').ListFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').BoardFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\timage\n\t\temail\n\t\temailVerified\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').UserFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetTodos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...TodoFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetLists(\n\t\t$where: lists_bool_exp = {}\n\t\t$order_by: [lists_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tlists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ListFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetListsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetBoards(\n\t\t$where: boards_bool_exp = {}\n\t\t$order_by: [boards_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateTodo($objects: [todos_insert_input!]!) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...TodoFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...TodoFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteTodos($where: todos_bool_exp!) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateList($objects: [lists_insert_input!]!) {\n\t\tinsert_lists(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateListDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {\n\t\tupdate_lists(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateListDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteList($where: lists_bool_exp!) {\n\t\tdelete_lists(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteListDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateBoard($objects: [boards_insert_input!]!) {\n\t\tinsert_boards(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {\n\t\tupdate_boards(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteBoard($where: boards_bool_exp!) {\n\t\tdelete_boards(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateUpload($objects: [uploads_insert_input!]!) {\n\t\tinsert_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\ttodo_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateUploadDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteUpload($where: uploads_bool_exp!) {\n\t\tdelete_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteUploadDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetUsers(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...UserFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetUsersDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
