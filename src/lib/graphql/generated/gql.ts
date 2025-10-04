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
    "\n\tfragment TodoFields on todos {\n\t\tid\n\t\ttitle\n\t\tcontent\n\t\tdue_on\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tgithub_issue_number\n\t\tgithub_issue_id\n\t\tgithub_synced_at\n\t\tgithub_url\n\t\tlabels {\n\t\t\tlabel {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t\tcomments(order_by: { created_at: asc }) {\n\t\t\t...CommentFields\n\t\t}\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\talias\n\t\t\t\tsort_order\n\t\t\t}\n\t\t}\n\t}\n": typeof types.TodoFieldsFragmentDoc,
    "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t\tsort_order\n\t\t}\n\t}\n": typeof types.ListFieldsFragmentDoc,
    "\n\tfragment BoardMemberFields on board_members {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\trole\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n": typeof types.BoardMemberFieldsFragmentDoc,
    "\n\tfragment BoardInvitationFields on board_invitations {\n\t\tid\n\t\tboard_id\n\t\tinviter_id\n\t\tinvitee_email\n\t\tinvitee_username\n\t\trole\n\t\tstatus\n\t\ttoken\n\t\tcreated_at\n\t\tupdated_at\n\t\texpires_at\n\t\tinviter {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n": typeof types.BoardInvitationFieldsFragmentDoc,
    "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\talias\n\t\tgithub\n\t\tsort_order\n\t\tis_public\n\t\tallow_public_comments\n\t\tcreated_at\n\t\tupdated_at\n\t\tlabels {\n\t\t\t...LabelFields\n\t\t}\n\t\tuser {\n\t\t\tid\n\t\t\tusername\n\t\t\temail\n\t\t}\n\t\tboard_members {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n": typeof types.BoardFieldsFragmentDoc,
    "\n\tfragment CommentFields on comments {\n\t\tid\n\t\tcontent\n\t\ttodo_id\n\t\tuser_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t}\n": typeof types.CommentFieldsFragmentDoc,
    "\n\tfragment LabelFields on labels {\n\t\tid\n\t\tname\n\t\tcolor\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.LabelFieldsFragmentDoc,
    "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\tusername\n\t\timage\n\t\temail\n\t\tlocale\n\t\tdark_mode\n\t\tsettings\n\t\tdefault_labels\n\t\temailVerified\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.UserFieldsFragmentDoc,
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
    "\n\tmutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {\n\t\tupdate_users(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...UserFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateUserDocument,
    "\n\tquery GetComments(\n\t\t$where: comments_bool_exp = {}\n\t\t$order_by: [comments_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tcomments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...CommentFields\n\t\t}\n\t}\n": typeof types.GetCommentsDocument,
    "\n\tmutation CreateComment($objects: [comments_insert_input!]!) {\n\t\tinsert_comments(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateCommentDocument,
    "\n\tmutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {\n\t\tupdate_comments(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateCommentDocument,
    "\n\tmutation DeleteComment($where: comments_bool_exp!) {\n\t\tdelete_comments(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteCommentDocument,
    "\n\tmutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {\n\t\tinsert_todo_labels(objects: $objects) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.AddTodoLabelDocument,
    "\n\tmutation RemoveTodoLabel($where: todo_labels_bool_exp!) {\n\t\tdelete_todo_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.RemoveTodoLabelDocument,
    "\n\tmutation CreateLabel($objects: [labels_insert_input!]!) {\n\t\tinsert_labels(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateLabelDocument,
    "\n\tmutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {\n\t\tupdate_labels(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateLabelDocument,
    "\n\tmutation DeleteLabel($where: labels_bool_exp!) {\n\t\tdelete_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteLabelDocument,
    "\n\tquery GetBoardMembers(\n\t\t$where: board_members_bool_exp = {}\n\t\t$order_by: [board_members_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n": typeof types.GetBoardMembersDocument,
    "\n\tmutation AddBoardMember($objects: [board_members_insert_input!]!) {\n\t\tinsert_board_members(\n\t\t\tobjects: $objects\n\t\t\ton_conflict: {\n\t\t\t\tconstraint: board_members_board_user_unique\n\t\t\t\tupdate_columns: [role, updated_at]\n\t\t\t}\n\t\t) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.AddBoardMemberDocument,
    "\n\tmutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {\n\t\tupdate_board_members(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateBoardMemberDocument,
    "\n\tmutation RemoveBoardMember($where: board_members_bool_exp!) {\n\t\tdelete_board_members(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.RemoveBoardMemberDocument,
    "\n\tquery GetBoardInvitations(\n\t\t$where: board_invitations_bool_exp = {}\n\t\t$order_by: [board_invitations_order_by!] = { created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_invitations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": typeof types.GetBoardInvitationsDocument,
    "\n\tquery GetMyInvitations($email: String!, $username: String!) {\n\t\tboard_invitations(\n\t\t\twhere: {\n\t\t\t\t_and: [\n\t\t\t\t\t{ status: { _eq: \"pending\" } }\n\t\t\t\t\t{ expires_at: { _gt: \"now()\" } }\n\t\t\t\t\t{\n\t\t\t\t\t\t_or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }]\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": typeof types.GetMyInvitationsDocument,
    "\n\tmutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {\n\t\tinsert_board_invitations(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateBoardInvitationDocument,
    "\n\tmutation UpdateBoardInvitation(\n\t\t$where: board_invitations_bool_exp!\n\t\t$_set: board_invitations_set_input!\n\t) {\n\t\tupdate_board_invitations(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateBoardInvitationDocument,
    "\n\tmutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {\n\t\tdelete_board_invitations(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteBoardInvitationDocument,
    "\n\tquery SearchUsers($search: String!) {\n\t\tusers(\n\t\t\twhere: {\n\t\t\t\t_or: [\n\t\t\t\t\t{ email: { _ilike: $search } }\n\t\t\t\t\t{ username: { _ilike: $search } }\n\t\t\t\t\t{ name: { _ilike: $search } }\n\t\t\t\t]\n\t\t\t}\n\t\t\tlimit: 10\n\t\t) {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n": typeof types.SearchUsersDocument,
    "\n\tmutation CreateLog($log: logs_insert_input!) {\n\t\tinsert_logs_one(object: $log) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t}\n\t}\n": typeof types.CreateLogDocument,
    "\n\tquery GetLogs(\n\t\t$where: logs_bool_exp\n\t\t$order_by: [logs_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tlogs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t\tdata\n\t\t\tuser_id\n\t\t\tsession_id\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlogs_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetLogsDocument,
};
const documents: Documents = {
    "\n\tfragment TodoFields on todos {\n\t\tid\n\t\ttitle\n\t\tcontent\n\t\tdue_on\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tgithub_issue_number\n\t\tgithub_issue_id\n\t\tgithub_synced_at\n\t\tgithub_url\n\t\tlabels {\n\t\t\tlabel {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t\tcomments(order_by: { created_at: asc }) {\n\t\t\t...CommentFields\n\t\t}\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\talias\n\t\t\t\tsort_order\n\t\t\t}\n\t\t}\n\t}\n": types.TodoFieldsFragmentDoc,
    "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t\tsort_order\n\t\t}\n\t}\n": types.ListFieldsFragmentDoc,
    "\n\tfragment BoardMemberFields on board_members {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\trole\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n": types.BoardMemberFieldsFragmentDoc,
    "\n\tfragment BoardInvitationFields on board_invitations {\n\t\tid\n\t\tboard_id\n\t\tinviter_id\n\t\tinvitee_email\n\t\tinvitee_username\n\t\trole\n\t\tstatus\n\t\ttoken\n\t\tcreated_at\n\t\tupdated_at\n\t\texpires_at\n\t\tinviter {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n": types.BoardInvitationFieldsFragmentDoc,
    "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\talias\n\t\tgithub\n\t\tsort_order\n\t\tis_public\n\t\tallow_public_comments\n\t\tcreated_at\n\t\tupdated_at\n\t\tlabels {\n\t\t\t...LabelFields\n\t\t}\n\t\tuser {\n\t\t\tid\n\t\t\tusername\n\t\t\temail\n\t\t}\n\t\tboard_members {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n": types.BoardFieldsFragmentDoc,
    "\n\tfragment CommentFields on comments {\n\t\tid\n\t\tcontent\n\t\ttodo_id\n\t\tuser_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t}\n": types.CommentFieldsFragmentDoc,
    "\n\tfragment LabelFields on labels {\n\t\tid\n\t\tname\n\t\tcolor\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.LabelFieldsFragmentDoc,
    "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\tusername\n\t\timage\n\t\temail\n\t\tlocale\n\t\tdark_mode\n\t\tsettings\n\t\tdefault_labels\n\t\temailVerified\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.UserFieldsFragmentDoc,
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
    "\n\tmutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {\n\t\tupdate_users(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...UserFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateUserDocument,
    "\n\tquery GetComments(\n\t\t$where: comments_bool_exp = {}\n\t\t$order_by: [comments_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tcomments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...CommentFields\n\t\t}\n\t}\n": types.GetCommentsDocument,
    "\n\tmutation CreateComment($objects: [comments_insert_input!]!) {\n\t\tinsert_comments(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateCommentDocument,
    "\n\tmutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {\n\t\tupdate_comments(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateCommentDocument,
    "\n\tmutation DeleteComment($where: comments_bool_exp!) {\n\t\tdelete_comments(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteCommentDocument,
    "\n\tmutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {\n\t\tinsert_todo_labels(objects: $objects) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.AddTodoLabelDocument,
    "\n\tmutation RemoveTodoLabel($where: todo_labels_bool_exp!) {\n\t\tdelete_todo_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.RemoveTodoLabelDocument,
    "\n\tmutation CreateLabel($objects: [labels_insert_input!]!) {\n\t\tinsert_labels(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateLabelDocument,
    "\n\tmutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {\n\t\tupdate_labels(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateLabelDocument,
    "\n\tmutation DeleteLabel($where: labels_bool_exp!) {\n\t\tdelete_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteLabelDocument,
    "\n\tquery GetBoardMembers(\n\t\t$where: board_members_bool_exp = {}\n\t\t$order_by: [board_members_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n": types.GetBoardMembersDocument,
    "\n\tmutation AddBoardMember($objects: [board_members_insert_input!]!) {\n\t\tinsert_board_members(\n\t\t\tobjects: $objects\n\t\t\ton_conflict: {\n\t\t\t\tconstraint: board_members_board_user_unique\n\t\t\t\tupdate_columns: [role, updated_at]\n\t\t\t}\n\t\t) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n": types.AddBoardMemberDocument,
    "\n\tmutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {\n\t\tupdate_board_members(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateBoardMemberDocument,
    "\n\tmutation RemoveBoardMember($where: board_members_bool_exp!) {\n\t\tdelete_board_members(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.RemoveBoardMemberDocument,
    "\n\tquery GetBoardInvitations(\n\t\t$where: board_invitations_bool_exp = {}\n\t\t$order_by: [board_invitations_order_by!] = { created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_invitations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": types.GetBoardInvitationsDocument,
    "\n\tquery GetMyInvitations($email: String!, $username: String!) {\n\t\tboard_invitations(\n\t\t\twhere: {\n\t\t\t\t_and: [\n\t\t\t\t\t{ status: { _eq: \"pending\" } }\n\t\t\t\t\t{ expires_at: { _gt: \"now()\" } }\n\t\t\t\t\t{\n\t\t\t\t\t\t_or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }]\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": types.GetMyInvitationsDocument,
    "\n\tmutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {\n\t\tinsert_board_invitations(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateBoardInvitationDocument,
    "\n\tmutation UpdateBoardInvitation(\n\t\t$where: board_invitations_bool_exp!\n\t\t$_set: board_invitations_set_input!\n\t) {\n\t\tupdate_board_invitations(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateBoardInvitationDocument,
    "\n\tmutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {\n\t\tdelete_board_invitations(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteBoardInvitationDocument,
    "\n\tquery SearchUsers($search: String!) {\n\t\tusers(\n\t\t\twhere: {\n\t\t\t\t_or: [\n\t\t\t\t\t{ email: { _ilike: $search } }\n\t\t\t\t\t{ username: { _ilike: $search } }\n\t\t\t\t\t{ name: { _ilike: $search } }\n\t\t\t\t]\n\t\t\t}\n\t\t\tlimit: 10\n\t\t) {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n": types.SearchUsersDocument,
    "\n\tmutation CreateLog($log: logs_insert_input!) {\n\t\tinsert_logs_one(object: $log) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t}\n\t}\n": types.CreateLogDocument,
    "\n\tquery GetLogs(\n\t\t$where: logs_bool_exp\n\t\t$order_by: [logs_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tlogs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t\tdata\n\t\t\tuser_id\n\t\t\tsession_id\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlogs_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": types.GetLogsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment TodoFields on todos {\n\t\tid\n\t\ttitle\n\t\tcontent\n\t\tdue_on\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tgithub_issue_number\n\t\tgithub_issue_id\n\t\tgithub_synced_at\n\t\tgithub_url\n\t\tlabels {\n\t\t\tlabel {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t\tcomments(order_by: { created_at: asc }) {\n\t\t\t...CommentFields\n\t\t}\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\talias\n\t\t\t\tsort_order\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').TodoFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t\tsort_order\n\t\t}\n\t}\n"): typeof import('./graphql').ListFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment BoardMemberFields on board_members {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\trole\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n"): typeof import('./graphql').BoardMemberFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment BoardInvitationFields on board_invitations {\n\t\tid\n\t\tboard_id\n\t\tinviter_id\n\t\tinvitee_email\n\t\tinvitee_username\n\t\trole\n\t\tstatus\n\t\ttoken\n\t\tcreated_at\n\t\tupdated_at\n\t\texpires_at\n\t\tinviter {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n"): typeof import('./graphql').BoardInvitationFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\talias\n\t\tgithub\n\t\tsort_order\n\t\tis_public\n\t\tallow_public_comments\n\t\tcreated_at\n\t\tupdated_at\n\t\tlabels {\n\t\t\t...LabelFields\n\t\t}\n\t\tuser {\n\t\t\tid\n\t\t\tusername\n\t\t\temail\n\t\t}\n\t\tboard_members {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n"): typeof import('./graphql').BoardFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment CommentFields on comments {\n\t\tid\n\t\tcontent\n\t\ttodo_id\n\t\tuser_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t}\n"): typeof import('./graphql').CommentFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment LabelFields on labels {\n\t\tid\n\t\tname\n\t\tcolor\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').LabelFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\tusername\n\t\timage\n\t\temail\n\t\tlocale\n\t\tdark_mode\n\t\tsettings\n\t\tdefault_labels\n\t\temailVerified\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').UserFieldsFragmentDoc;
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
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {\n\t\tupdate_users(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...UserFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateUserDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetComments(\n\t\t$where: comments_bool_exp = {}\n\t\t$order_by: [comments_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tcomments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...CommentFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetCommentsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateComment($objects: [comments_insert_input!]!) {\n\t\tinsert_comments(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateCommentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {\n\t\tupdate_comments(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateCommentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteComment($where: comments_bool_exp!) {\n\t\tdelete_comments(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteCommentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {\n\t\tinsert_todo_labels(objects: $objects) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').AddTodoLabelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation RemoveTodoLabel($where: todo_labels_bool_exp!) {\n\t\tdelete_todo_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').RemoveTodoLabelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateLabel($objects: [labels_insert_input!]!) {\n\t\tinsert_labels(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateLabelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {\n\t\tupdate_labels(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateLabelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteLabel($where: labels_bool_exp!) {\n\t\tdelete_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteLabelDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetBoardMembers(\n\t\t$where: board_members_bool_exp = {}\n\t\t$order_by: [board_members_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardMembersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation AddBoardMember($objects: [board_members_insert_input!]!) {\n\t\tinsert_board_members(\n\t\t\tobjects: $objects\n\t\t\ton_conflict: {\n\t\t\t\tconstraint: board_members_board_user_unique\n\t\t\t\tupdate_columns: [role, updated_at]\n\t\t\t}\n\t\t) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').AddBoardMemberDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {\n\t\tupdate_board_members(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateBoardMemberDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation RemoveBoardMember($where: board_members_bool_exp!) {\n\t\tdelete_board_members(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').RemoveBoardMemberDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetBoardInvitations(\n\t\t$where: board_invitations_bool_exp = {}\n\t\t$order_by: [board_invitations_order_by!] = { created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_invitations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardInvitationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetMyInvitations($email: String!, $username: String!) {\n\t\tboard_invitations(\n\t\t\twhere: {\n\t\t\t\t_and: [\n\t\t\t\t\t{ status: { _eq: \"pending\" } }\n\t\t\t\t\t{ expires_at: { _gt: \"now()\" } }\n\t\t\t\t\t{\n\t\t\t\t\t\t_or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }]\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetMyInvitationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {\n\t\tinsert_board_invitations(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateBoardInvitationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateBoardInvitation(\n\t\t$where: board_invitations_bool_exp!\n\t\t$_set: board_invitations_set_input!\n\t) {\n\t\tupdate_board_invitations(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateBoardInvitationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {\n\t\tdelete_board_invitations(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteBoardInvitationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery SearchUsers($search: String!) {\n\t\tusers(\n\t\t\twhere: {\n\t\t\t\t_or: [\n\t\t\t\t\t{ email: { _ilike: $search } }\n\t\t\t\t\t{ username: { _ilike: $search } }\n\t\t\t\t\t{ name: { _ilike: $search } }\n\t\t\t\t]\n\t\t\t}\n\t\t\tlimit: 10\n\t\t) {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n"): typeof import('./graphql').SearchUsersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateLog($log: logs_insert_input!) {\n\t\tinsert_logs_one(object: $log) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t}\n\t}\n"): typeof import('./graphql').CreateLogDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetLogs(\n\t\t$where: logs_bool_exp\n\t\t$order_by: [logs_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tlogs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t\tdata\n\t\t\tuser_id\n\t\t\tsession_id\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlogs_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetLogsDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
