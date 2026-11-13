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
    "\n\tfragment TodoFields on todos {\n\t\tid\n\t\talias\n\t\ttitle\n\t\tcontent_preview\n\t\tdue_on\n\t\thas_time\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tassigned_to\n\t\tgithub_issue_number\n\t\tgithub_issue_id\n\t\tgithub_synced_at\n\t\tgithub_url\n\t\ttask_file_path\n\t\tagent_model\n\t\tagent_effort\n\t\tagent_machine\n\t\tagent_plan_first\n\t\tmin_hours\n\t\tmax_hours\n\t\tactual_hours\n\t\tcomment_hours\n\t\tclaude_usages_aggregate {\n\t\t\taggregate {\n\t\t\t\tsum {\n\t\t\t\t\tcost_usd\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tassignee {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t\tassignees {\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tassignee {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t\tlabels {\n\t\t\tlabel {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t\tcomments_aggregate {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tsubscribers {\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tsubscriber {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t}\n": typeof types.TodoFieldsFragmentDoc,
    "\n\tfragment TodoDetailFields on todos {\n\t\t...TodoFields\n\t\tcontent\n\t}\n": typeof types.TodoDetailFieldsFragmentDoc,
    "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t\tsort_order\n\t\t\tgithub\n\t\t}\n\t}\n": typeof types.ListFieldsFragmentDoc,
    "\n\tfragment BoardMemberFields on board_members {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\trole\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n": typeof types.BoardMemberFieldsFragmentDoc,
    "\n\tfragment BoardInvitationFields on board_invitations {\n\t\tid\n\t\tboard_id\n\t\tinviter_id\n\t\tinvitee_email\n\t\tinvitee_username\n\t\trole\n\t\tstatus\n\t\ttoken\n\t\tcreated_at\n\t\tupdated_at\n\t\texpires_at\n\t\tinviter {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n": typeof types.BoardInvitationFieldsFragmentDoc,
    "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\talias\n\t\tsort_order\n\t\tgithub\n\t\tis_public\n\t\tallow_public_comments\n\t\tsettings\n\t\tarchived_at\n\t\tclient_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tlabels {\n\t\t\t...LabelFields\n\t\t}\n\t\tuser {\n\t\t\tid\n\t\t\tusername\n\t\t\temail\n\t\t\tclaude_plan\n\t\t\tclaude_plan_monthly\n\t\t\tclaude_plan_currency\n\t\t}\n\t\tboard_members {\n\t\t\t...BoardMemberFields\n\t\t}\n\t\tclient {\n\t\t\tid\n\t\t\tname\n\t\t\tcompany_name\n\t\t\temail\n\t\t\tcurrency\n\t\t\tdefault_rate\n\t\t}\n\t}\n": typeof types.BoardFieldsFragmentDoc,
    "\n\tfragment CommentFields on comments {\n\t\tid\n\t\tcontent\n\t\ttodo_id\n\t\tuser_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tgithub_comment_id\n\t\tgithub_synced_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t}\n": typeof types.CommentFieldsFragmentDoc,
    "\n\tfragment LabelFields on labels {\n\t\tid\n\t\tname\n\t\tcolor\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.LabelFieldsFragmentDoc,
    "\n\tfragment NoteCoreFields on notes {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\tparent_id\n\t\ttitle\n\t\tcontent\n\t\tcover_image_url\n\t\tsort_order\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t\tnote_uploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t}\n": typeof types.NoteCoreFieldsFragmentDoc,
    "\n\tfragment NoteFields on notes {\n\t\t...NoteCoreFields\n\t\tsubnotes(order_by: { sort_order: asc }) {\n\t\t\t...NoteCoreFields\n\t\t}\n\t}\n": typeof types.NoteFieldsFragmentDoc,
    "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\tusername\n\t\timage\n\t\temail\n\t\tlocale\n\t\tdark_mode\n\t\tsettings\n\t\tdefault_labels\n\t\temailVerified\n\t\tplan\n\t\tplan_expires_at\n\t\tclaude_plan\n\t\tclaude_plan_monthly\n\t\tclaude_plan_currency\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.UserFieldsFragmentDoc,
    "\n\tquery GetTodos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...TodoFields\n\t\t}\n\t}\n": typeof types.GetTodosDocument,
    "\n\tquery GetTodoDetails($where: todos_bool_exp!) {\n\t\ttodos(where: $where, limit: 1) {\n\t\t\t...TodoDetailFields\n\t\t}\n\t}\n": typeof types.GetTodoDetailsDocument,
    "\n\tquery SearchTodoContent($where: todos_bool_exp!) {\n\t\ttodos(where: $where) {\n\t\t\tid\n\t\t}\n\t}\n": typeof types.SearchTodoContentDocument,
    "\n\tquery PollUnread($userId: uuid!) {\n\t\tnotifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": typeof types.PollUnreadDocument,
    "\n\tquery PollBoard($userId: uuid!, $boardId: uuid!) {\n\t\tnotifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t\tboards_by_pk(id: $boardId) {\n\t\t\tupdated_at\n\t\t\tchanged_at\n\t\t}\n\t\t# Until the runner writes through the API (#231) and bumps changed_at, its card\n\t\t# creates and moves are seen through this one aggregate. Drop it in #231.\n\t\ttodos_aggregate(where: { list: { board_id: { _eq: $boardId } } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t\tmax {\n\t\t\t\t\tupdated_at\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.PollBoardDocument,
    "\n\tquery GetLists(\n\t\t$where: lists_bool_exp = {}\n\t\t$order_by: [lists_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tlists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ListFields\n\t\t}\n\t}\n": typeof types.GetListsDocument,
    "\n\tquery GetBoards(\n\t\t$where: boards_bool_exp = {}\n\t\t$order_by: [boards_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardFields\n\t\t}\n\t}\n": typeof types.GetBoardsDocument,
    "\n\tquery GetNotes(\n\t\t$where: notes_bool_exp = {}\n\t\t$order_by: [notes_order_by!] = { sort_order: asc, created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tnotes(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...NoteFields\n\t\t}\n\t}\n": typeof types.GetNotesDocument,
    "\n\tmutation CreateTodo($objects: [todos_insert_input!]!) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...TodoDetailFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateTodoDocument,
    "\n\tmutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...TodoDetailFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateTodosDocument,
    "\n\tmutation DeleteTodos($where: todos_bool_exp!) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteTodosDocument,
    "\n\tmutation UpdateTaskFilePath($id: uuid!, $path: String) {\n\t\tupdate_todos_by_pk(pk_columns: { id: $id }, _set: { task_file_path: $path }) {\n\t\t\tid\n\t\t\ttask_file_path\n\t\t}\n\t}\n": typeof types.UpdateTaskFilePathDocument,
    "\n\tmutation CreateList($objects: [lists_insert_input!]!) {\n\t\tinsert_lists(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateListDocument,
    "\n\tmutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {\n\t\tupdate_lists(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateListDocument,
    "\n\tmutation DeleteList($where: lists_bool_exp!) {\n\t\tdelete_lists(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteListDocument,
    "\n\tmutation CreateBoard($objects: [boards_insert_input!]!) {\n\t\tinsert_boards(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateBoardDocument,
    "\n\tmutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {\n\t\tupdate_boards(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateBoardDocument,
    "\n\tmutation DeleteBoard($where: boards_bool_exp!) {\n\t\tdelete_boards(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteBoardDocument,
    "\n\tmutation CreateNote($objects: [notes_insert_input!]!) {\n\t\tinsert_notes(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateNoteDocument,
    "\n\tmutation UpdateNote($where: notes_bool_exp!, $_set: notes_set_input!) {\n\t\tupdate_notes(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateNoteDocument,
    "\n\tmutation UpdateNotes($updates: [notes_updates!]!) {\n\t\tupdate_notes_many(updates: $updates) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateNotesDocument,
    "\n\tmutation DeleteNote($where: notes_bool_exp!) {\n\t\tdelete_notes(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteNoteDocument,
    "\n\tmutation CreateUpload($objects: [uploads_insert_input!]!) {\n\t\tinsert_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\ttodo_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateUploadDocument,
    "\n\tmutation DeleteUpload($where: uploads_bool_exp!) {\n\t\tdelete_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteUploadDocument,
    "\n\tquery GetNoteBoards($ids: [uuid!]!) {\n\t\tnotes(where: { id: { _in: $ids } }) {\n\t\t\tid\n\t\t\tboard_id\n\t\t}\n\t}\n": typeof types.GetNoteBoardsDocument,
    "\n\tquery GetNoteUploadNote($id: uuid!) {\n\t\tnote_uploads_by_pk(id: $id) {\n\t\t\tnote_id\n\t\t}\n\t}\n": typeof types.GetNoteUploadNoteDocument,
    "\n\tmutation CreateNoteUpload($objects: [note_uploads_insert_input!]!) {\n\t\tinsert_note_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\tnote_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateNoteUploadDocument,
    "\n\tmutation DeleteNoteUpload($where: note_uploads_bool_exp!) {\n\t\tdelete_note_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteNoteUploadDocument,
    "\n\tquery GetUsers(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...UserFields\n\t\t}\n\t}\n": typeof types.GetUsersDocument,
    "\n\tmutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {\n\t\tupdate_users(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...UserFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateUserDocument,
    "\n\tquery GetComments(\n\t\t$where: comments_bool_exp = {}\n\t\t$order_by: [comments_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tcomments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...CommentFields\n\t\t}\n\t}\n": typeof types.GetCommentsDocument,
    "\n\tquery GetClaudeUsageMonth($user_id: uuid!, $from: timestamptz!, $to: timestamptz!) {\n\t\tclaude_usage_aggregate(\n\t\t\twhere: { user_id: { _eq: $user_id }, created_at: { _gte: $from, _lt: $to } }\n\t\t) {\n\t\t\taggregate {\n\t\t\t\tsum {\n\t\t\t\t\tcost_usd\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetClaudeUsageMonthDocument,
    "\n\tquery GetCommentsAggregate($where: comments_bool_exp = {}) {\n\t\tcomments_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetCommentsAggregateDocument,
    "\n\tmutation CreateComment($objects: [comments_insert_input!]!) {\n\t\tinsert_comments(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateCommentDocument,
    "\n\tmutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {\n\t\tupdate_comments(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateCommentDocument,
    "\n\tmutation DeleteComment($where: comments_bool_exp!) {\n\t\tdelete_comments(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteCommentDocument,
    "\n\tmutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {\n\t\tinsert_todo_labels(objects: $objects) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.AddTodoLabelDocument,
    "\n\tmutation RemoveTodoLabel($where: todo_labels_bool_exp!) {\n\t\tdelete_todo_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.RemoveTodoLabelDocument,
    "\n\tmutation CreateLabel($objects: [labels_insert_input!]!) {\n\t\tinsert_labels(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateLabelDocument,
    "\n\tmutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {\n\t\tupdate_labels(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateLabelDocument,
    "\n\tmutation DeleteLabel($where: labels_bool_exp!) {\n\t\tdelete_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteLabelDocument,
    "\n\tquery GetBoardRole($boardId: uuid!, $userId: uuid!) {\n\t\tboards_by_pk(id: $boardId) {\n\t\t\tuser_id\n\t\t\tis_public\n\t\t\tboard_members(where: { user_id: { _eq: $userId } }) {\n\t\t\t\trole\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetBoardRoleDocument,
    "\n\tquery GetListBoard($id: uuid!) {\n\t\tlists_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t\tname\n\t\t}\n\t}\n": typeof types.GetListBoardDocument,
    "\n\tquery GetCardAccess($id: uuid!, $userId: uuid!) {\n\t\ttodos_by_pk(id: $id) {\n\t\t\tid\n\t\t\tuser_id\n\t\t\tlist_id\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tcompleted_at\n\t\t\tpriority\n\t\t\tdue_on\n\t\t\thas_time\n\t\t\tassigned_to\n\t\t\tmin_hours\n\t\t\tmax_hours\n\t\t\tactual_hours\n\t\t\tcomment_hours\n\t\t\ttask_file_path\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tassignees {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tsubscribers {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tlist {\n\t\t\t\tname\n\t\t\t\tboard_id\n\t\t\t\tboard {\n\t\t\t\t\tuser_id\n\t\t\t\t\tis_public\n\t\t\t\t\tboard_members(where: { user_id: { _eq: $userId } }) {\n\t\t\t\t\t\trole\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetCardAccessDocument,
    "\n\tmutation CardWritten(\n\t\t$boardIds: [uuid!]!\n\t\t$at: timestamptz!\n\t\t$logs: [activity_logs_insert_input!]!\n\t\t$notifications: [notifications_insert_input!]!\n\t) {\n\t\tupdate_boards(where: { id: { _in: $boardIds } }, _set: { changed_at: $at }) {\n\t\t\taffected_rows\n\t\t}\n\t\tinsert_activity_logs(objects: $logs) {\n\t\t\taffected_rows\n\t\t}\n\t\tinsert_notifications(objects: $notifications) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.CardWrittenDocument,
    "\n\tquery GetCommentAccess($id: uuid!) {\n\t\tcomments_by_pk(id: $id) {\n\t\t\tid\n\t\t\tuser_id\n\t\t\ttodo_id\n\t\t\tcontent\n\t\t}\n\t}\n": typeof types.GetCommentAccessDocument,
    "\n\tquery GetUploadTodo($id: uuid!) {\n\t\tuploads_by_pk(id: $id) {\n\t\t\ttodo_id\n\t\t}\n\t}\n": typeof types.GetUploadTodoDocument,
    "\n\tmutation MarkMyNotificationsRead($userId: uuid!, $ids: [uuid!]!) {\n\t\tupdate_notifications(\n\t\t\twhere: { user_id: { _eq: $userId }, id: { _in: $ids } }\n\t\t\t_set: { is_read: true }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.MarkMyNotificationsReadDocument,
    "\n\tmutation DeleteMyNotification($userId: uuid!, $id: uuid!) {\n\t\tdelete_notifications(where: { user_id: { _eq: $userId }, id: { _eq: $id } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteMyNotificationDocument,
    "\n\tquery GetLabelBoard($id: uuid!) {\n\t\tlabels_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t}\n\t}\n": typeof types.GetLabelBoardDocument,
    "\n\tquery GetMemberBoard($id: uuid!) {\n\t\tboard_members_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t\tuser_id\n\t\t}\n\t}\n": typeof types.GetMemberBoardDocument,
    "\n\tquery GetInvitationBoard($id: uuid!) {\n\t\tboard_invitations_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t}\n\t}\n": typeof types.GetInvitationBoardDocument,
    "\n\tquery GetUserIdentity($id: uuid!) {\n\t\tusers_by_pk(id: $id) {\n\t\t\temail\n\t\t\tusername\n\t\t}\n\t}\n": typeof types.GetUserIdentityDocument,
    "\n\tquery GetBoardMembers(\n\t\t$where: board_members_bool_exp = {}\n\t\t$order_by: [board_members_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n": typeof types.GetBoardMembersDocument,
    "\n\tmutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {\n\t\tupdate_board_members(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateBoardMemberDocument,
    "\n\tmutation RemoveBoardMember($where: board_members_bool_exp!) {\n\t\tdelete_board_members(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.RemoveBoardMemberDocument,
    "\n\tquery GetBoardInvitations(\n\t\t$where: board_invitations_bool_exp = {}\n\t\t$order_by: [board_invitations_order_by!] = { created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_invitations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": typeof types.GetBoardInvitationsDocument,
    "\n\tquery GetMyInvitations($email: String!, $username: String!) {\n\t\tboard_invitations(\n\t\t\twhere: {\n\t\t\t\t_and: [\n\t\t\t\t\t{ status: { _eq: \"pending\" } }\n\t\t\t\t\t{ expires_at: { _gt: \"now()\" } }\n\t\t\t\t\t{ _or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }] }\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": typeof types.GetMyInvitationsDocument,
    "\n\tquery GetInvitation($where: board_invitations_bool_exp!) {\n\t\tboard_invitations(where: $where, limit: 1) {\n\t\t\tid\n\t\t\tboard_id\n\t\t\trole\n\t\t\tstatus\n\t\t\tinvitee_email\n\t\t\tinvitee_username\n\t\t\texpires_at\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\talias\n\t\t\t\tuser {\n\t\t\t\t\tusername\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetInvitationDocument,
    "\n\tmutation AcceptInvitation($id: uuid!, $member: board_members_insert_input!) {\n\t\tinsert_board_members_one(\n\t\t\tobject: $member\n\t\t\ton_conflict: {\n\t\t\t\tconstraint: board_members_board_user_unique\n\t\t\t\tupdate_columns: [role]\n\t\t\t\twhere: { role: { _neq: \"owner\" } }\n\t\t\t}\n\t\t) {\n\t\t\tid\n\t\t}\n\t\tupdate_board_invitations_by_pk(pk_columns: { id: $id }, _set: { status: \"accepted\" }) {\n\t\t\tid\n\t\t}\n\t}\n": typeof types.AcceptInvitationDocument,
    "\n\tmutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {\n\t\tinsert_board_invitations(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreateBoardInvitationDocument,
    "\n\tmutation UpdateBoardInvitation(\n\t\t$where: board_invitations_bool_exp!\n\t\t$_set: board_invitations_set_input!\n\t) {\n\t\tupdate_board_invitations(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateBoardInvitationDocument,
    "\n\tmutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {\n\t\tdelete_board_invitations(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteBoardInvitationDocument,
    "\n\tquery GetPeople($userId: uuid!) {\n\t\tusers(\n\t\t\twhere: {\n\t\t\t\t_or: [\n\t\t\t\t\t{ id: { _eq: $userId } }\n\t\t\t\t\t{ boards: { board_members: { user_id: { _eq: $userId } } } }\n\t\t\t\t\t{\n\t\t\t\t\t\tboard_members: {\n\t\t\t\t\t\t\tboard: {\n\t\t\t\t\t\t\t\t_or: [\n\t\t\t\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t\t\t\t]\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { name: asc }\n\t\t\tlimit: 500\n\t\t) {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": typeof types.GetPeopleDocument,
    "\n\tquery GetTodoByGithubIssue($githubIssueId: bigint!) {\n\t\ttodos(where: { github_issue_id: { _eq: $githubIssueId } }, limit: 1) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tcompleted_at\n\t\t\tpriority\n\t\t\tassigned_to\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tgithub_synced_at\n\t\t\tassignees {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tuser_id\n\t\t\t\t\tgithub\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetTodoByGithubIssueDocument,
    "\n\tquery GetActivityLogByCommitSha($todoId: uuid!, $commitSha: jsonb!) {\n\t\tactivity_logs(\n\t\t\twhere: { todo_id: { _eq: $todoId }, changes: { _contains: $commitSha } }\n\t\t\tlimit: 1\n\t\t) {\n\t\t\tid\n\t\t}\n\t}\n": typeof types.GetActivityLogByCommitShaDocument,
    "\n\tquery GetCommentByGithubId($githubCommentId: bigint!) {\n\t\tcomments(where: { github_comment_id: { _eq: $githubCommentId } }, limit: 1) {\n\t\t\tid\n\t\t\tcontent\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tgithub_comment_id\n\t\t}\n\t}\n": typeof types.GetCommentByGithubIdDocument,
    "\n\tquery GetUserByGithubUsername($githubUsername: String!) {\n\t\tusers(\n\t\t\twhere: { settings: { _contains: { tokens: { github: { username: $githubUsername } } } } }\n\t\t\tlimit: 1\n\t\t) {\n\t\t\tid\n\t\t\tusername\n\t\t\tsettings\n\t\t}\n\t}\n": typeof types.GetUserByGithubUsernameDocument,
    "\n\tmutation CreateLogs($logs: [logs_insert_input!]!) {\n\t\tinsert_logs(objects: $logs) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.CreateLogsDocument,
    "\n\tmutation DeleteOldLogs($before: timestamptz!) {\n\t\tdelete_logs(where: { created_at: { _lt: $before } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteOldLogsDocument,
    "\n\tquery GetLogs($where: logs_bool_exp, $order_by: [logs_order_by!], $limit: Int, $offset: Int) {\n\t\tlogs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t\tdata\n\t\t\tuser_id\n\t\t\tsession_id\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlogs_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetLogsDocument,
    "\n\tfragment NotificationFields on notifications {\n\t\tid\n\t\tuser_id\n\t\ttodo_id\n\t\ttype\n\t\ttriggered_by_user_id\n\t\trelated_comment_id\n\t\tcontent\n\t\tis_read\n\t\tcreated_at\n\t\tupdated_at\n\t\ttriggered_by_user {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\ttodo {\n\t\t\tid\n\t\t\ttitle\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\talias\n\t\t\t\t\tuser {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tusername\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tnews {\n\t\t\tid\n\t\t\ttitle\n\t\t\tbody\n\t\t\turl\n\t\t}\n\t}\n": typeof types.NotificationFieldsFragmentDoc,
    "\n\tquery GetNotifications(\n\t\t$where: notifications_bool_exp\n\t\t$order_by: [notifications_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tnotifications(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...NotificationFields\n\t\t}\n\t}\n": typeof types.GetNotificationsDocument,
    "\n\tmutation CreateNotification($notification: notifications_insert_input!) {\n\t\tinsert_notifications_one(object: $notification) {\n\t\t\t...NotificationFields\n\t\t}\n\t}\n": typeof types.CreateNotificationDocument,
    "\n\tmutation CreatePushSubscription($subscription: push_subscriptions_insert_input!) {\n\t\tinsert_push_subscriptions_one(\n\t\t\tobject: $subscription\n\t\t\ton_conflict: { constraint: push_subscriptions_endpoint_key, update_columns: [p256dh, auth, user_id] }\n\t\t) {\n\t\t\tid\n\t\t\tendpoint\n\t\t}\n\t}\n": typeof types.CreatePushSubscriptionDocument,
    "\n\tmutation DeletePushSubscription($endpoint: String!, $userId: uuid!) {\n\t\tdelete_push_subscriptions(\n\t\t\twhere: { endpoint: { _eq: $endpoint }, user_id: { _eq: $userId } }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeletePushSubscriptionDocument,
    "\n\tfragment ActivityLogFields on activity_logs {\n\t\tid\n\t\tuser_id\n\t\ttodo_id\n\t\taction_type\n\t\tfield_name\n\t\told_value\n\t\tnew_value\n\t\tchanges\n\t\tcreated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\ttodo {\n\t\t\tid\n\t\t\talias\n\t\t\ttitle\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\talias\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.ActivityLogFieldsFragmentDoc,
    "\n\tquery GetActivityLogs(\n\t\t$where: activity_logs_bool_exp\n\t\t$order_by: [activity_logs_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tactivity_logs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ActivityLogFields\n\t\t}\n\t}\n": typeof types.GetActivityLogsDocument,
    "\n\tmutation CreateActivityLog($log: activity_logs_insert_input!) {\n\t\tinsert_activity_logs_one(object: $log) {\n\t\t\t...ActivityLogFields\n\t\t}\n\t}\n": typeof types.CreateActivityLogDocument,
    "\n\tquery GetTodoById($id: uuid!) {\n\t\ttodos_by_pk(id: $id) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tlist_id\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tgithub_url\n\t\t\tlist {\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tuser_id\n\t\t\t\t\tgithub\n\t\t\t\t\tlists(order_by: { sort_order: asc }) {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetTodoByIdDocument,
    "\n\tmutation SubscribeToTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tinsert_todo_subscribers_one(object: { todo_id: $todo_id, user_id: $user_id }) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tsubscriber {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t}\n": typeof types.SubscribeToTodoDocument,
    "\n\tmutation UnsubscribeFromTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tdelete_todo_subscribers_by_pk(todo_id: $todo_id, user_id: $user_id) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t}\n\t}\n": typeof types.UnsubscribeFromTodoDocument,
    "\n\tmutation AssignUserToTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tinsert_todo_assignees_one(\n\t\t\tobject: { todo_id: $todo_id, user_id: $user_id }\n\t\t\ton_conflict: { constraint: todo_assignees_pkey, update_columns: [] }\n\t\t) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tassignee {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t}\n": typeof types.AssignUserToTodoDocument,
    "\n\tmutation UnassignUserFromTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tdelete_todo_assignees_by_pk(todo_id: $todo_id, user_id: $user_id) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t}\n\t}\n": typeof types.UnassignUserFromTodoDocument,
    "\n\tfragment ExpenseSplitFields on expense_splits {\n\t\tid\n\t\tuser_id\n\t\tamount\n\t\texpense_id\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": typeof types.ExpenseSplitFieldsFragmentDoc,
    "\n\tfragment ExpenseFields on expenses {\n\t\tid\n\t\tamount\n\t\tdescription\n\t\tcreated_by\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tdeleted_at\n\t\tcreated {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\texpense_splits {\n\t\t\t...ExpenseSplitFields\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n": typeof types.ExpenseFieldsFragmentDoc,
    "\n\tquery GetBoardExpenses($board_id: uuid!) {\n\t\texpenses(\n\t\t\twhere: { board_id: { _eq: $board_id }, deleted_at: { _is_null: true } }\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n": typeof types.GetBoardExpensesDocument,
    "\n\tmutation CreateExpense($object: expenses_insert_input!) {\n\t\tinsert_expenses_one(object: $object) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n": typeof types.CreateExpenseDocument,
    "\n\tmutation DeleteExpense($id: uuid!, $userId: uuid!, $deleted_at: timestamptz!) {\n\t\tupdate_expenses(\n\t\t\twhere: {\n\t\t\t\tid: { _eq: $id }\n\t\t\t\tcreated_by: { _eq: $userId }\n\t\t\t\tdeleted_at: { _is_null: true }\n\t\t\t\tboard: {\n\t\t\t\t\t_or: [\n\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t\t_set: { deleted_at: $deleted_at }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteExpenseDocument,
    "\n\tfragment UrlShortcutFields on url_shortcuts {\n\t\tid\n\t\tuser_id\n\t\talias\n\t\ttarget_url\n\t\tvisit_count\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.UrlShortcutFieldsFragmentDoc,
    "\n\tquery GetUrlShortcuts($userId: uuid!) {\n\t\turl_shortcuts(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {\n\t\t\t...UrlShortcutFields\n\t\t}\n\t}\n": typeof types.GetUrlShortcutsDocument,
    "\n\tquery GetUrlShortcutByAlias($alias: String!) {\n\t\turl_shortcuts(where: { alias: { _eq: $alias } }, limit: 1) {\n\t\t\talias\n\t\t\ttarget_url\n\t\t}\n\t}\n": typeof types.GetUrlShortcutByAliasDocument,
    "\n\tmutation CreateUrlShortcut($object: url_shortcuts_insert_input!) {\n\t\tinsert_url_shortcuts_one(object: $object) {\n\t\t\t...UrlShortcutFields\n\t\t}\n\t}\n": typeof types.CreateUrlShortcutDocument,
    "\n\tmutation UpdateUrlShortcut($id: uuid!, $userId: uuid!, $_set: url_shortcuts_set_input!) {\n\t\tupdate_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...UrlShortcutFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateUrlShortcutDocument,
    "\n\tmutation DeleteUrlShortcut($id: uuid!, $userId: uuid!) {\n\t\tdelete_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteUrlShortcutDocument,
    "\n\tmutation IncrementUrlShortcutVisits($alias: String!) {\n\t\tupdate_url_shortcuts(where: { alias: { _eq: $alias } }, _inc: { visit_count: 1 }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.IncrementUrlShortcutVisitsDocument,
    "\n\tquery GetAllUserExpenses($userId: uuid!) {\n\t\texpenses(\n\t\t\twhere: {\n\t\t\t\tdeleted_at: { _is_null: true }\n\t\t\t\tboard: {\n\t\t\t\t\t_or: [\n\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n": typeof types.GetAllUserExpensesDocument,
    "\n\tfragment ClientFields on clients {\n\t\tid\n\t\tuser_id\n\t\tlinked_user_id\n\t\tname\n\t\tcompany_name\n\t\temail\n\t\tphone\n\t\taddress\n\t\tvat_number\n\t\tcurrency\n\t\tdefault_rate\n\t\tnotes\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.ClientFieldsFragmentDoc,
    "\n\tquery GetClients($userId: uuid!) {\n\t\tclients(where: { user_id: { _eq: $userId } }, order_by: { name: asc }) {\n\t\t\t...ClientFields\n\t\t}\n\t}\n": typeof types.GetClientsDocument,
    "\n\tmutation CreateClient($object: clients_insert_input!) {\n\t\tinsert_clients_one(object: $object) {\n\t\t\t...ClientFields\n\t\t}\n\t}\n": typeof types.CreateClientDocument,
    "\n\tmutation UpdateClient($id: uuid!, $userId: uuid!, $_set: clients_set_input!) {\n\t\tupdate_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...ClientFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateClientDocument,
    "\n\tmutation DeleteClient($id: uuid!, $userId: uuid!) {\n\t\tdelete_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteClientDocument,
    "\n\tfragment InvoiceCompanyFields on invoice_companies {\n\t\tid\n\t\tuser_id\n\t\tname\n\t\taddress\n\t\tvat_number\n\t\tvat_rate\n\t\tiban\n\t\tswift\n\t\tis_default\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": typeof types.InvoiceCompanyFieldsFragmentDoc,
    "\n\tquery GetInvoiceCompanies($userId: uuid!) {\n\t\tinvoice_companies(where: { user_id: { _eq: $userId } }, order_by: [{ is_default: desc }, { name: asc }]) {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t}\n": typeof types.GetInvoiceCompaniesDocument,
    "\n\tmutation CreateInvoiceCompany($object: invoice_companies_insert_input!) {\n\t\tinsert_invoice_companies_one(object: $object) {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t}\n": typeof types.CreateInvoiceCompanyDocument,
    "\n\tmutation UpdateInvoiceCompany($id: uuid!, $userId: uuid!, $_set: invoice_companies_set_input!) {\n\t\tupdate_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...InvoiceCompanyFields\n\t\t\t}\n\t\t}\n\t}\n": typeof types.UpdateInvoiceCompanyDocument,
    "\n\tmutation DeleteInvoiceCompany($id: uuid!, $userId: uuid!) {\n\t\tdelete_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteInvoiceCompanyDocument,
    "\n\tfragment InvoiceItemFields on invoice_items {\n\t\tid\n\t\tinvoice_id\n\t\ttodo_id\n\t\ttitle\n\t\thours\n\t\thourly_rate\n\t\tamount\n\t\tcreated_at\n\t}\n": typeof types.InvoiceItemFieldsFragmentDoc,
    "\n\tfragment InvoiceFields on invoices {\n\t\tid\n\t\tuser_id\n\t\tclient_id\n\t\tboard_id\n\t\tcompany_id\n\t\tinvoice_number\n\t\tissued_date\n\t\tdue_date\n\t\tcurrency\n\t\thourly_rate\n\t\ttotal_hours\n\t\ttotal_amount\n\t\tcustom_fields\n\t\tnotes\n\t\tstatus\n\t\tcreated_at\n\t\tupdated_at\n\t\tclient {\n\t\t\t...ClientFields\n\t\t}\n\t\tcompany {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t\titems {\n\t\t\t...InvoiceItemFields\n\t\t}\n\t}\n": typeof types.InvoiceFieldsFragmentDoc,
    "\n\tquery GetBoardInvoices($board_id: uuid!, $userId: uuid!) {\n\t\tinvoices(\n\t\t\twhere: { board_id: { _eq: $board_id }, user_id: { _eq: $userId } }\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n": typeof types.GetBoardInvoicesDocument,
    "\n\tquery GetAllInvoices($userId: uuid!) {\n\t\tinvoices(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n": typeof types.GetAllInvoicesDocument,
    "\n\tquery GetInvoiceParties($clientId: uuid!, $companyId: uuid!, $userId: uuid!) {\n\t\tclients(where: { id: { _eq: $clientId }, user_id: { _eq: $userId } }) {\n\t\t\tid\n\t\t}\n\t\tinvoice_companies(where: { id: { _eq: $companyId }, user_id: { _eq: $userId } }) {\n\t\t\tid\n\t\t}\n\t}\n": typeof types.GetInvoicePartiesDocument,
    "\n\tmutation CreateInvoiceWithItems($invoice: invoices_insert_input!) {\n\t\tinsert_invoices_one(object: $invoice) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n": typeof types.CreateInvoiceWithItemsDocument,
    "\n\tquery GetInvoicesIssuedToday($today: date!, $userId: uuid!) {\n\t\tinvoices_aggregate(where: { issued_date: { _eq: $today }, user_id: { _eq: $userId } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetInvoicesIssuedTodayDocument,
    "\n\tmutation UpdateInvoiceStatus($id: uuid!, $userId: uuid!, $status: String!) {\n\t\tupdate_invoices(\n\t\t\twhere: { id: { _eq: $id }, user_id: { _eq: $userId } }\n\t\t\t_set: { status: $status }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.UpdateInvoiceStatusDocument,
    "\n\tmutation DeleteInvoice($id: uuid!, $userId: uuid!) {\n\t\tdelete_invoice_items(\n\t\t\twhere: { invoice: { id: { _eq: $id }, user_id: { _eq: $userId } } }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t\tdelete_invoices(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": typeof types.DeleteInvoiceDocument,
    "\n\tquery GetTodosForInvoicing($where: todos_bool_exp!) {\n\t\ttodos(where: $where, order_by: { sort_order: asc }) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tactual_hours\n\t\t\tlist_id\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n": typeof types.GetTodosForInvoicingDocument,
    "\n\tmutation VerifyUserPassword($email: String!, $password: String!) {\n\t\tverify_user_password(args: { user_email: $email, user_password: $password }) {\n\t\t\tid\n\t\t\tname\n\t\t\temail\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": typeof types.VerifyUserPasswordDocument,
    "\n\tmutation CreatePasswordUser($email: String!, $name: String!, $password: String!) {\n\t\tcreate_password_user(args: { user_email: $email, user_name: $name, user_password: $password }) {\n\t\t\tid\n\t\t\tname\n\t\t\temail\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": typeof types.CreatePasswordUserDocument,
};
const documents: Documents = {
    "\n\tfragment TodoFields on todos {\n\t\tid\n\t\talias\n\t\ttitle\n\t\tcontent_preview\n\t\tdue_on\n\t\thas_time\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tassigned_to\n\t\tgithub_issue_number\n\t\tgithub_issue_id\n\t\tgithub_synced_at\n\t\tgithub_url\n\t\ttask_file_path\n\t\tagent_model\n\t\tagent_effort\n\t\tagent_machine\n\t\tagent_plan_first\n\t\tmin_hours\n\t\tmax_hours\n\t\tactual_hours\n\t\tcomment_hours\n\t\tclaude_usages_aggregate {\n\t\t\taggregate {\n\t\t\t\tsum {\n\t\t\t\t\tcost_usd\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tassignee {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t\tassignees {\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tassignee {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t\tlabels {\n\t\t\tlabel {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t\tcomments_aggregate {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tsubscribers {\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tsubscriber {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t}\n": types.TodoFieldsFragmentDoc,
    "\n\tfragment TodoDetailFields on todos {\n\t\t...TodoFields\n\t\tcontent\n\t}\n": types.TodoDetailFieldsFragmentDoc,
    "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t\tsort_order\n\t\t\tgithub\n\t\t}\n\t}\n": types.ListFieldsFragmentDoc,
    "\n\tfragment BoardMemberFields on board_members {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\trole\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t}\n": types.BoardMemberFieldsFragmentDoc,
    "\n\tfragment BoardInvitationFields on board_invitations {\n\t\tid\n\t\tboard_id\n\t\tinviter_id\n\t\tinvitee_email\n\t\tinvitee_username\n\t\trole\n\t\tstatus\n\t\ttoken\n\t\tcreated_at\n\t\tupdated_at\n\t\texpires_at\n\t\tinviter {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\temail\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n": types.BoardInvitationFieldsFragmentDoc,
    "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\talias\n\t\tsort_order\n\t\tgithub\n\t\tis_public\n\t\tallow_public_comments\n\t\tsettings\n\t\tarchived_at\n\t\tclient_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tlabels {\n\t\t\t...LabelFields\n\t\t}\n\t\tuser {\n\t\t\tid\n\t\t\tusername\n\t\t\temail\n\t\t\tclaude_plan\n\t\t\tclaude_plan_monthly\n\t\t\tclaude_plan_currency\n\t\t}\n\t\tboard_members {\n\t\t\t...BoardMemberFields\n\t\t}\n\t\tclient {\n\t\t\tid\n\t\t\tname\n\t\t\tcompany_name\n\t\t\temail\n\t\t\tcurrency\n\t\t\tdefault_rate\n\t\t}\n\t}\n": types.BoardFieldsFragmentDoc,
    "\n\tfragment CommentFields on comments {\n\t\tid\n\t\tcontent\n\t\ttodo_id\n\t\tuser_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tgithub_comment_id\n\t\tgithub_synced_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t}\n": types.CommentFieldsFragmentDoc,
    "\n\tfragment LabelFields on labels {\n\t\tid\n\t\tname\n\t\tcolor\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.LabelFieldsFragmentDoc,
    "\n\tfragment NoteCoreFields on notes {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\tparent_id\n\t\ttitle\n\t\tcontent\n\t\tcover_image_url\n\t\tsort_order\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t\tnote_uploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t}\n": types.NoteCoreFieldsFragmentDoc,
    "\n\tfragment NoteFields on notes {\n\t\t...NoteCoreFields\n\t\tsubnotes(order_by: { sort_order: asc }) {\n\t\t\t...NoteCoreFields\n\t\t}\n\t}\n": types.NoteFieldsFragmentDoc,
    "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\tusername\n\t\timage\n\t\temail\n\t\tlocale\n\t\tdark_mode\n\t\tsettings\n\t\tdefault_labels\n\t\temailVerified\n\t\tplan\n\t\tplan_expires_at\n\t\tclaude_plan\n\t\tclaude_plan_monthly\n\t\tclaude_plan_currency\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.UserFieldsFragmentDoc,
    "\n\tquery GetTodos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...TodoFields\n\t\t}\n\t}\n": types.GetTodosDocument,
    "\n\tquery GetTodoDetails($where: todos_bool_exp!) {\n\t\ttodos(where: $where, limit: 1) {\n\t\t\t...TodoDetailFields\n\t\t}\n\t}\n": types.GetTodoDetailsDocument,
    "\n\tquery SearchTodoContent($where: todos_bool_exp!) {\n\t\ttodos(where: $where) {\n\t\t\tid\n\t\t}\n\t}\n": types.SearchTodoContentDocument,
    "\n\tquery PollUnread($userId: uuid!) {\n\t\tnotifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": types.PollUnreadDocument,
    "\n\tquery PollBoard($userId: uuid!, $boardId: uuid!) {\n\t\tnotifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t\tboards_by_pk(id: $boardId) {\n\t\t\tupdated_at\n\t\t\tchanged_at\n\t\t}\n\t\t# Until the runner writes through the API (#231) and bumps changed_at, its card\n\t\t# creates and moves are seen through this one aggregate. Drop it in #231.\n\t\ttodos_aggregate(where: { list: { board_id: { _eq: $boardId } } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t\tmax {\n\t\t\t\t\tupdated_at\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.PollBoardDocument,
    "\n\tquery GetLists(\n\t\t$where: lists_bool_exp = {}\n\t\t$order_by: [lists_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tlists(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ListFields\n\t\t}\n\t}\n": types.GetListsDocument,
    "\n\tquery GetBoards(\n\t\t$where: boards_bool_exp = {}\n\t\t$order_by: [boards_order_by!] = { sort_order: asc, name: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboards(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardFields\n\t\t}\n\t}\n": types.GetBoardsDocument,
    "\n\tquery GetNotes(\n\t\t$where: notes_bool_exp = {}\n\t\t$order_by: [notes_order_by!] = { sort_order: asc, created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tnotes(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...NoteFields\n\t\t}\n\t}\n": types.GetNotesDocument,
    "\n\tmutation CreateTodo($objects: [todos_insert_input!]!) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...TodoDetailFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateTodoDocument,
    "\n\tmutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...TodoDetailFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateTodosDocument,
    "\n\tmutation DeleteTodos($where: todos_bool_exp!) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteTodosDocument,
    "\n\tmutation UpdateTaskFilePath($id: uuid!, $path: String) {\n\t\tupdate_todos_by_pk(pk_columns: { id: $id }, _set: { task_file_path: $path }) {\n\t\t\tid\n\t\t\ttask_file_path\n\t\t}\n\t}\n": types.UpdateTaskFilePathDocument,
    "\n\tmutation CreateList($objects: [lists_insert_input!]!) {\n\t\tinsert_lists(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateListDocument,
    "\n\tmutation UpdateList($where: lists_bool_exp!, $_set: lists_set_input!) {\n\t\tupdate_lists(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...ListFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateListDocument,
    "\n\tmutation DeleteList($where: lists_bool_exp!) {\n\t\tdelete_lists(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteListDocument,
    "\n\tmutation CreateBoard($objects: [boards_insert_input!]!) {\n\t\tinsert_boards(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateBoardDocument,
    "\n\tmutation UpdateBoard($where: boards_bool_exp!, $_set: boards_set_input!) {\n\t\tupdate_boards(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateBoardDocument,
    "\n\tmutation DeleteBoard($where: boards_bool_exp!) {\n\t\tdelete_boards(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteBoardDocument,
    "\n\tmutation CreateNote($objects: [notes_insert_input!]!) {\n\t\tinsert_notes(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateNoteDocument,
    "\n\tmutation UpdateNote($where: notes_bool_exp!, $_set: notes_set_input!) {\n\t\tupdate_notes(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateNoteDocument,
    "\n\tmutation UpdateNotes($updates: [notes_updates!]!) {\n\t\tupdate_notes_many(updates: $updates) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateNotesDocument,
    "\n\tmutation DeleteNote($where: notes_bool_exp!) {\n\t\tdelete_notes(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteNoteDocument,
    "\n\tmutation CreateUpload($objects: [uploads_insert_input!]!) {\n\t\tinsert_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\ttodo_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n": types.CreateUploadDocument,
    "\n\tmutation DeleteUpload($where: uploads_bool_exp!) {\n\t\tdelete_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteUploadDocument,
    "\n\tquery GetNoteBoards($ids: [uuid!]!) {\n\t\tnotes(where: { id: { _in: $ids } }) {\n\t\t\tid\n\t\t\tboard_id\n\t\t}\n\t}\n": types.GetNoteBoardsDocument,
    "\n\tquery GetNoteUploadNote($id: uuid!) {\n\t\tnote_uploads_by_pk(id: $id) {\n\t\t\tnote_id\n\t\t}\n\t}\n": types.GetNoteUploadNoteDocument,
    "\n\tmutation CreateNoteUpload($objects: [note_uploads_insert_input!]!) {\n\t\tinsert_note_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\tnote_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n": types.CreateNoteUploadDocument,
    "\n\tmutation DeleteNoteUpload($where: note_uploads_bool_exp!) {\n\t\tdelete_note_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteNoteUploadDocument,
    "\n\tquery GetUsers(\n\t\t$where: users_bool_exp = {}\n\t\t$order_by: [users_order_by!] = {}\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tusers(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...UserFields\n\t\t}\n\t}\n": types.GetUsersDocument,
    "\n\tmutation UpdateUser($where: users_bool_exp!, $_set: users_set_input!) {\n\t\tupdate_users(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...UserFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateUserDocument,
    "\n\tquery GetComments(\n\t\t$where: comments_bool_exp = {}\n\t\t$order_by: [comments_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tcomments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...CommentFields\n\t\t}\n\t}\n": types.GetCommentsDocument,
    "\n\tquery GetClaudeUsageMonth($user_id: uuid!, $from: timestamptz!, $to: timestamptz!) {\n\t\tclaude_usage_aggregate(\n\t\t\twhere: { user_id: { _eq: $user_id }, created_at: { _gte: $from, _lt: $to } }\n\t\t) {\n\t\t\taggregate {\n\t\t\t\tsum {\n\t\t\t\t\tcost_usd\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.GetClaudeUsageMonthDocument,
    "\n\tquery GetCommentsAggregate($where: comments_bool_exp = {}) {\n\t\tcomments_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": types.GetCommentsAggregateDocument,
    "\n\tmutation CreateComment($objects: [comments_insert_input!]!) {\n\t\tinsert_comments(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateCommentDocument,
    "\n\tmutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {\n\t\tupdate_comments(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...CommentFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateCommentDocument,
    "\n\tmutation DeleteComment($where: comments_bool_exp!) {\n\t\tdelete_comments(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteCommentDocument,
    "\n\tmutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {\n\t\tinsert_todo_labels(objects: $objects) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.AddTodoLabelDocument,
    "\n\tmutation RemoveTodoLabel($where: todo_labels_bool_exp!) {\n\t\tdelete_todo_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.RemoveTodoLabelDocument,
    "\n\tmutation CreateLabel($objects: [labels_insert_input!]!) {\n\t\tinsert_labels(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateLabelDocument,
    "\n\tmutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {\n\t\tupdate_labels(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateLabelDocument,
    "\n\tmutation DeleteLabel($where: labels_bool_exp!) {\n\t\tdelete_labels(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteLabelDocument,
    "\n\tquery GetBoardRole($boardId: uuid!, $userId: uuid!) {\n\t\tboards_by_pk(id: $boardId) {\n\t\t\tuser_id\n\t\t\tis_public\n\t\t\tboard_members(where: { user_id: { _eq: $userId } }) {\n\t\t\t\trole\n\t\t\t}\n\t\t}\n\t}\n": types.GetBoardRoleDocument,
    "\n\tquery GetListBoard($id: uuid!) {\n\t\tlists_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t\tname\n\t\t}\n\t}\n": types.GetListBoardDocument,
    "\n\tquery GetCardAccess($id: uuid!, $userId: uuid!) {\n\t\ttodos_by_pk(id: $id) {\n\t\t\tid\n\t\t\tuser_id\n\t\t\tlist_id\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tcompleted_at\n\t\t\tpriority\n\t\t\tdue_on\n\t\t\thas_time\n\t\t\tassigned_to\n\t\t\tmin_hours\n\t\t\tmax_hours\n\t\t\tactual_hours\n\t\t\tcomment_hours\n\t\t\ttask_file_path\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tassignees {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tsubscribers {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tlist {\n\t\t\t\tname\n\t\t\t\tboard_id\n\t\t\t\tboard {\n\t\t\t\t\tuser_id\n\t\t\t\t\tis_public\n\t\t\t\t\tboard_members(where: { user_id: { _eq: $userId } }) {\n\t\t\t\t\t\trole\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.GetCardAccessDocument,
    "\n\tmutation CardWritten(\n\t\t$boardIds: [uuid!]!\n\t\t$at: timestamptz!\n\t\t$logs: [activity_logs_insert_input!]!\n\t\t$notifications: [notifications_insert_input!]!\n\t) {\n\t\tupdate_boards(where: { id: { _in: $boardIds } }, _set: { changed_at: $at }) {\n\t\t\taffected_rows\n\t\t}\n\t\tinsert_activity_logs(objects: $logs) {\n\t\t\taffected_rows\n\t\t}\n\t\tinsert_notifications(objects: $notifications) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.CardWrittenDocument,
    "\n\tquery GetCommentAccess($id: uuid!) {\n\t\tcomments_by_pk(id: $id) {\n\t\t\tid\n\t\t\tuser_id\n\t\t\ttodo_id\n\t\t\tcontent\n\t\t}\n\t}\n": types.GetCommentAccessDocument,
    "\n\tquery GetUploadTodo($id: uuid!) {\n\t\tuploads_by_pk(id: $id) {\n\t\t\ttodo_id\n\t\t}\n\t}\n": types.GetUploadTodoDocument,
    "\n\tmutation MarkMyNotificationsRead($userId: uuid!, $ids: [uuid!]!) {\n\t\tupdate_notifications(\n\t\t\twhere: { user_id: { _eq: $userId }, id: { _in: $ids } }\n\t\t\t_set: { is_read: true }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.MarkMyNotificationsReadDocument,
    "\n\tmutation DeleteMyNotification($userId: uuid!, $id: uuid!) {\n\t\tdelete_notifications(where: { user_id: { _eq: $userId }, id: { _eq: $id } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteMyNotificationDocument,
    "\n\tquery GetLabelBoard($id: uuid!) {\n\t\tlabels_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t}\n\t}\n": types.GetLabelBoardDocument,
    "\n\tquery GetMemberBoard($id: uuid!) {\n\t\tboard_members_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t\tuser_id\n\t\t}\n\t}\n": types.GetMemberBoardDocument,
    "\n\tquery GetInvitationBoard($id: uuid!) {\n\t\tboard_invitations_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t}\n\t}\n": types.GetInvitationBoardDocument,
    "\n\tquery GetUserIdentity($id: uuid!) {\n\t\tusers_by_pk(id: $id) {\n\t\t\temail\n\t\t\tusername\n\t\t}\n\t}\n": types.GetUserIdentityDocument,
    "\n\tquery GetBoardMembers(\n\t\t$where: board_members_bool_exp = {}\n\t\t$order_by: [board_members_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n": types.GetBoardMembersDocument,
    "\n\tmutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {\n\t\tupdate_board_members(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardMemberFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateBoardMemberDocument,
    "\n\tmutation RemoveBoardMember($where: board_members_bool_exp!) {\n\t\tdelete_board_members(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.RemoveBoardMemberDocument,
    "\n\tquery GetBoardInvitations(\n\t\t$where: board_invitations_bool_exp = {}\n\t\t$order_by: [board_invitations_order_by!] = { created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_invitations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": types.GetBoardInvitationsDocument,
    "\n\tquery GetMyInvitations($email: String!, $username: String!) {\n\t\tboard_invitations(\n\t\t\twhere: {\n\t\t\t\t_and: [\n\t\t\t\t\t{ status: { _eq: \"pending\" } }\n\t\t\t\t\t{ expires_at: { _gt: \"now()\" } }\n\t\t\t\t\t{ _or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }] }\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n": types.GetMyInvitationsDocument,
    "\n\tquery GetInvitation($where: board_invitations_bool_exp!) {\n\t\tboard_invitations(where: $where, limit: 1) {\n\t\t\tid\n\t\t\tboard_id\n\t\t\trole\n\t\t\tstatus\n\t\t\tinvitee_email\n\t\t\tinvitee_username\n\t\t\texpires_at\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\talias\n\t\t\t\tuser {\n\t\t\t\t\tusername\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.GetInvitationDocument,
    "\n\tmutation AcceptInvitation($id: uuid!, $member: board_members_insert_input!) {\n\t\tinsert_board_members_one(\n\t\t\tobject: $member\n\t\t\ton_conflict: {\n\t\t\t\tconstraint: board_members_board_user_unique\n\t\t\t\tupdate_columns: [role]\n\t\t\t\twhere: { role: { _neq: \"owner\" } }\n\t\t\t}\n\t\t) {\n\t\t\tid\n\t\t}\n\t\tupdate_board_invitations_by_pk(pk_columns: { id: $id }, _set: { status: \"accepted\" }) {\n\t\t\tid\n\t\t}\n\t}\n": types.AcceptInvitationDocument,
    "\n\tmutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {\n\t\tinsert_board_invitations(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": types.CreateBoardInvitationDocument,
    "\n\tmutation UpdateBoardInvitation(\n\t\t$where: board_invitations_bool_exp!\n\t\t$_set: board_invitations_set_input!\n\t) {\n\t\tupdate_board_invitations(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...BoardInvitationFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateBoardInvitationDocument,
    "\n\tmutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {\n\t\tdelete_board_invitations(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteBoardInvitationDocument,
    "\n\tquery GetPeople($userId: uuid!) {\n\t\tusers(\n\t\t\twhere: {\n\t\t\t\t_or: [\n\t\t\t\t\t{ id: { _eq: $userId } }\n\t\t\t\t\t{ boards: { board_members: { user_id: { _eq: $userId } } } }\n\t\t\t\t\t{\n\t\t\t\t\t\tboard_members: {\n\t\t\t\t\t\t\tboard: {\n\t\t\t\t\t\t\t\t_or: [\n\t\t\t\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t\t\t\t]\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { name: asc }\n\t\t\tlimit: 500\n\t\t) {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": types.GetPeopleDocument,
    "\n\tquery GetTodoByGithubIssue($githubIssueId: bigint!) {\n\t\ttodos(where: { github_issue_id: { _eq: $githubIssueId } }, limit: 1) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tcompleted_at\n\t\t\tpriority\n\t\t\tassigned_to\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tgithub_synced_at\n\t\t\tassignees {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tuser_id\n\t\t\t\t\tgithub\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.GetTodoByGithubIssueDocument,
    "\n\tquery GetActivityLogByCommitSha($todoId: uuid!, $commitSha: jsonb!) {\n\t\tactivity_logs(\n\t\t\twhere: { todo_id: { _eq: $todoId }, changes: { _contains: $commitSha } }\n\t\t\tlimit: 1\n\t\t) {\n\t\t\tid\n\t\t}\n\t}\n": types.GetActivityLogByCommitShaDocument,
    "\n\tquery GetCommentByGithubId($githubCommentId: bigint!) {\n\t\tcomments(where: { github_comment_id: { _eq: $githubCommentId } }, limit: 1) {\n\t\t\tid\n\t\t\tcontent\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tgithub_comment_id\n\t\t}\n\t}\n": types.GetCommentByGithubIdDocument,
    "\n\tquery GetUserByGithubUsername($githubUsername: String!) {\n\t\tusers(\n\t\t\twhere: { settings: { _contains: { tokens: { github: { username: $githubUsername } } } } }\n\t\t\tlimit: 1\n\t\t) {\n\t\t\tid\n\t\t\tusername\n\t\t\tsettings\n\t\t}\n\t}\n": types.GetUserByGithubUsernameDocument,
    "\n\tmutation CreateLogs($logs: [logs_insert_input!]!) {\n\t\tinsert_logs(objects: $logs) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.CreateLogsDocument,
    "\n\tmutation DeleteOldLogs($before: timestamptz!) {\n\t\tdelete_logs(where: { created_at: { _lt: $before } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteOldLogsDocument,
    "\n\tquery GetLogs($where: logs_bool_exp, $order_by: [logs_order_by!], $limit: Int, $offset: Int) {\n\t\tlogs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t\tdata\n\t\t\tuser_id\n\t\t\tsession_id\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlogs_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": types.GetLogsDocument,
    "\n\tfragment NotificationFields on notifications {\n\t\tid\n\t\tuser_id\n\t\ttodo_id\n\t\ttype\n\t\ttriggered_by_user_id\n\t\trelated_comment_id\n\t\tcontent\n\t\tis_read\n\t\tcreated_at\n\t\tupdated_at\n\t\ttriggered_by_user {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\ttodo {\n\t\t\tid\n\t\t\ttitle\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\talias\n\t\t\t\t\tuser {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tusername\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tnews {\n\t\t\tid\n\t\t\ttitle\n\t\t\tbody\n\t\t\turl\n\t\t}\n\t}\n": types.NotificationFieldsFragmentDoc,
    "\n\tquery GetNotifications(\n\t\t$where: notifications_bool_exp\n\t\t$order_by: [notifications_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tnotifications(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...NotificationFields\n\t\t}\n\t}\n": types.GetNotificationsDocument,
    "\n\tmutation CreateNotification($notification: notifications_insert_input!) {\n\t\tinsert_notifications_one(object: $notification) {\n\t\t\t...NotificationFields\n\t\t}\n\t}\n": types.CreateNotificationDocument,
    "\n\tmutation CreatePushSubscription($subscription: push_subscriptions_insert_input!) {\n\t\tinsert_push_subscriptions_one(\n\t\t\tobject: $subscription\n\t\t\ton_conflict: { constraint: push_subscriptions_endpoint_key, update_columns: [p256dh, auth, user_id] }\n\t\t) {\n\t\t\tid\n\t\t\tendpoint\n\t\t}\n\t}\n": types.CreatePushSubscriptionDocument,
    "\n\tmutation DeletePushSubscription($endpoint: String!, $userId: uuid!) {\n\t\tdelete_push_subscriptions(\n\t\t\twhere: { endpoint: { _eq: $endpoint }, user_id: { _eq: $userId } }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeletePushSubscriptionDocument,
    "\n\tfragment ActivityLogFields on activity_logs {\n\t\tid\n\t\tuser_id\n\t\ttodo_id\n\t\taction_type\n\t\tfield_name\n\t\told_value\n\t\tnew_value\n\t\tchanges\n\t\tcreated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\ttodo {\n\t\t\tid\n\t\t\talias\n\t\t\ttitle\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\talias\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.ActivityLogFieldsFragmentDoc,
    "\n\tquery GetActivityLogs(\n\t\t$where: activity_logs_bool_exp\n\t\t$order_by: [activity_logs_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tactivity_logs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ActivityLogFields\n\t\t}\n\t}\n": types.GetActivityLogsDocument,
    "\n\tmutation CreateActivityLog($log: activity_logs_insert_input!) {\n\t\tinsert_activity_logs_one(object: $log) {\n\t\t\t...ActivityLogFields\n\t\t}\n\t}\n": types.CreateActivityLogDocument,
    "\n\tquery GetTodoById($id: uuid!) {\n\t\ttodos_by_pk(id: $id) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tlist_id\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tgithub_url\n\t\t\tlist {\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tuser_id\n\t\t\t\t\tgithub\n\t\t\t\t\tlists(order_by: { sort_order: asc }) {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n": types.GetTodoByIdDocument,
    "\n\tmutation SubscribeToTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tinsert_todo_subscribers_one(object: { todo_id: $todo_id, user_id: $user_id }) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tsubscriber {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t}\n": types.SubscribeToTodoDocument,
    "\n\tmutation UnsubscribeFromTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tdelete_todo_subscribers_by_pk(todo_id: $todo_id, user_id: $user_id) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t}\n\t}\n": types.UnsubscribeFromTodoDocument,
    "\n\tmutation AssignUserToTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tinsert_todo_assignees_one(\n\t\t\tobject: { todo_id: $todo_id, user_id: $user_id }\n\t\t\ton_conflict: { constraint: todo_assignees_pkey, update_columns: [] }\n\t\t) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tassignee {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t}\n": types.AssignUserToTodoDocument,
    "\n\tmutation UnassignUserFromTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tdelete_todo_assignees_by_pk(todo_id: $todo_id, user_id: $user_id) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t}\n\t}\n": types.UnassignUserFromTodoDocument,
    "\n\tfragment ExpenseSplitFields on expense_splits {\n\t\tid\n\t\tuser_id\n\t\tamount\n\t\texpense_id\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": types.ExpenseSplitFieldsFragmentDoc,
    "\n\tfragment ExpenseFields on expenses {\n\t\tid\n\t\tamount\n\t\tdescription\n\t\tcreated_by\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tdeleted_at\n\t\tcreated {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\texpense_splits {\n\t\t\t...ExpenseSplitFields\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n": types.ExpenseFieldsFragmentDoc,
    "\n\tquery GetBoardExpenses($board_id: uuid!) {\n\t\texpenses(\n\t\t\twhere: { board_id: { _eq: $board_id }, deleted_at: { _is_null: true } }\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n": types.GetBoardExpensesDocument,
    "\n\tmutation CreateExpense($object: expenses_insert_input!) {\n\t\tinsert_expenses_one(object: $object) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n": types.CreateExpenseDocument,
    "\n\tmutation DeleteExpense($id: uuid!, $userId: uuid!, $deleted_at: timestamptz!) {\n\t\tupdate_expenses(\n\t\t\twhere: {\n\t\t\t\tid: { _eq: $id }\n\t\t\t\tcreated_by: { _eq: $userId }\n\t\t\t\tdeleted_at: { _is_null: true }\n\t\t\t\tboard: {\n\t\t\t\t\t_or: [\n\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t\t_set: { deleted_at: $deleted_at }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteExpenseDocument,
    "\n\tfragment UrlShortcutFields on url_shortcuts {\n\t\tid\n\t\tuser_id\n\t\talias\n\t\ttarget_url\n\t\tvisit_count\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.UrlShortcutFieldsFragmentDoc,
    "\n\tquery GetUrlShortcuts($userId: uuid!) {\n\t\turl_shortcuts(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {\n\t\t\t...UrlShortcutFields\n\t\t}\n\t}\n": types.GetUrlShortcutsDocument,
    "\n\tquery GetUrlShortcutByAlias($alias: String!) {\n\t\turl_shortcuts(where: { alias: { _eq: $alias } }, limit: 1) {\n\t\t\talias\n\t\t\ttarget_url\n\t\t}\n\t}\n": types.GetUrlShortcutByAliasDocument,
    "\n\tmutation CreateUrlShortcut($object: url_shortcuts_insert_input!) {\n\t\tinsert_url_shortcuts_one(object: $object) {\n\t\t\t...UrlShortcutFields\n\t\t}\n\t}\n": types.CreateUrlShortcutDocument,
    "\n\tmutation UpdateUrlShortcut($id: uuid!, $userId: uuid!, $_set: url_shortcuts_set_input!) {\n\t\tupdate_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...UrlShortcutFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateUrlShortcutDocument,
    "\n\tmutation DeleteUrlShortcut($id: uuid!, $userId: uuid!) {\n\t\tdelete_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteUrlShortcutDocument,
    "\n\tmutation IncrementUrlShortcutVisits($alias: String!) {\n\t\tupdate_url_shortcuts(where: { alias: { _eq: $alias } }, _inc: { visit_count: 1 }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.IncrementUrlShortcutVisitsDocument,
    "\n\tquery GetAllUserExpenses($userId: uuid!) {\n\t\texpenses(\n\t\t\twhere: {\n\t\t\t\tdeleted_at: { _is_null: true }\n\t\t\t\tboard: {\n\t\t\t\t\t_or: [\n\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n": types.GetAllUserExpensesDocument,
    "\n\tfragment ClientFields on clients {\n\t\tid\n\t\tuser_id\n\t\tlinked_user_id\n\t\tname\n\t\tcompany_name\n\t\temail\n\t\tphone\n\t\taddress\n\t\tvat_number\n\t\tcurrency\n\t\tdefault_rate\n\t\tnotes\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.ClientFieldsFragmentDoc,
    "\n\tquery GetClients($userId: uuid!) {\n\t\tclients(where: { user_id: { _eq: $userId } }, order_by: { name: asc }) {\n\t\t\t...ClientFields\n\t\t}\n\t}\n": types.GetClientsDocument,
    "\n\tmutation CreateClient($object: clients_insert_input!) {\n\t\tinsert_clients_one(object: $object) {\n\t\t\t...ClientFields\n\t\t}\n\t}\n": types.CreateClientDocument,
    "\n\tmutation UpdateClient($id: uuid!, $userId: uuid!, $_set: clients_set_input!) {\n\t\tupdate_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...ClientFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateClientDocument,
    "\n\tmutation DeleteClient($id: uuid!, $userId: uuid!) {\n\t\tdelete_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteClientDocument,
    "\n\tfragment InvoiceCompanyFields on invoice_companies {\n\t\tid\n\t\tuser_id\n\t\tname\n\t\taddress\n\t\tvat_number\n\t\tvat_rate\n\t\tiban\n\t\tswift\n\t\tis_default\n\t\tcreated_at\n\t\tupdated_at\n\t}\n": types.InvoiceCompanyFieldsFragmentDoc,
    "\n\tquery GetInvoiceCompanies($userId: uuid!) {\n\t\tinvoice_companies(where: { user_id: { _eq: $userId } }, order_by: [{ is_default: desc }, { name: asc }]) {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t}\n": types.GetInvoiceCompaniesDocument,
    "\n\tmutation CreateInvoiceCompany($object: invoice_companies_insert_input!) {\n\t\tinsert_invoice_companies_one(object: $object) {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t}\n": types.CreateInvoiceCompanyDocument,
    "\n\tmutation UpdateInvoiceCompany($id: uuid!, $userId: uuid!, $_set: invoice_companies_set_input!) {\n\t\tupdate_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...InvoiceCompanyFields\n\t\t\t}\n\t\t}\n\t}\n": types.UpdateInvoiceCompanyDocument,
    "\n\tmutation DeleteInvoiceCompany($id: uuid!, $userId: uuid!) {\n\t\tdelete_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteInvoiceCompanyDocument,
    "\n\tfragment InvoiceItemFields on invoice_items {\n\t\tid\n\t\tinvoice_id\n\t\ttodo_id\n\t\ttitle\n\t\thours\n\t\thourly_rate\n\t\tamount\n\t\tcreated_at\n\t}\n": types.InvoiceItemFieldsFragmentDoc,
    "\n\tfragment InvoiceFields on invoices {\n\t\tid\n\t\tuser_id\n\t\tclient_id\n\t\tboard_id\n\t\tcompany_id\n\t\tinvoice_number\n\t\tissued_date\n\t\tdue_date\n\t\tcurrency\n\t\thourly_rate\n\t\ttotal_hours\n\t\ttotal_amount\n\t\tcustom_fields\n\t\tnotes\n\t\tstatus\n\t\tcreated_at\n\t\tupdated_at\n\t\tclient {\n\t\t\t...ClientFields\n\t\t}\n\t\tcompany {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t\titems {\n\t\t\t...InvoiceItemFields\n\t\t}\n\t}\n": types.InvoiceFieldsFragmentDoc,
    "\n\tquery GetBoardInvoices($board_id: uuid!, $userId: uuid!) {\n\t\tinvoices(\n\t\t\twhere: { board_id: { _eq: $board_id }, user_id: { _eq: $userId } }\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n": types.GetBoardInvoicesDocument,
    "\n\tquery GetAllInvoices($userId: uuid!) {\n\t\tinvoices(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n": types.GetAllInvoicesDocument,
    "\n\tquery GetInvoiceParties($clientId: uuid!, $companyId: uuid!, $userId: uuid!) {\n\t\tclients(where: { id: { _eq: $clientId }, user_id: { _eq: $userId } }) {\n\t\t\tid\n\t\t}\n\t\tinvoice_companies(where: { id: { _eq: $companyId }, user_id: { _eq: $userId } }) {\n\t\t\tid\n\t\t}\n\t}\n": types.GetInvoicePartiesDocument,
    "\n\tmutation CreateInvoiceWithItems($invoice: invoices_insert_input!) {\n\t\tinsert_invoices_one(object: $invoice) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n": types.CreateInvoiceWithItemsDocument,
    "\n\tquery GetInvoicesIssuedToday($today: date!, $userId: uuid!) {\n\t\tinvoices_aggregate(where: { issued_date: { _eq: $today }, user_id: { _eq: $userId } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n": types.GetInvoicesIssuedTodayDocument,
    "\n\tmutation UpdateInvoiceStatus($id: uuid!, $userId: uuid!, $status: String!) {\n\t\tupdate_invoices(\n\t\t\twhere: { id: { _eq: $id }, user_id: { _eq: $userId } }\n\t\t\t_set: { status: $status }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.UpdateInvoiceStatusDocument,
    "\n\tmutation DeleteInvoice($id: uuid!, $userId: uuid!) {\n\t\tdelete_invoice_items(\n\t\t\twhere: { invoice: { id: { _eq: $id }, user_id: { _eq: $userId } } }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t\tdelete_invoices(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n": types.DeleteInvoiceDocument,
    "\n\tquery GetTodosForInvoicing($where: todos_bool_exp!) {\n\t\ttodos(where: $where, order_by: { sort_order: asc }) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tactual_hours\n\t\t\tlist_id\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n": types.GetTodosForInvoicingDocument,
    "\n\tmutation VerifyUserPassword($email: String!, $password: String!) {\n\t\tverify_user_password(args: { user_email: $email, user_password: $password }) {\n\t\t\tid\n\t\t\tname\n\t\t\temail\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": types.VerifyUserPasswordDocument,
    "\n\tmutation CreatePasswordUser($email: String!, $name: String!, $password: String!) {\n\t\tcreate_password_user(args: { user_email: $email, user_name: $name, user_password: $password }) {\n\t\t\tid\n\t\t\tname\n\t\t\temail\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n": types.CreatePasswordUserDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment TodoFields on todos {\n\t\tid\n\t\talias\n\t\ttitle\n\t\tcontent_preview\n\t\tdue_on\n\t\thas_time\n\t\tsort_order\n\t\tpriority\n\t\tlist_id\n\t\tcompleted_at\n\t\tcreated_at\n\t\tupdated_at\n\t\tassigned_to\n\t\tgithub_issue_number\n\t\tgithub_issue_id\n\t\tgithub_synced_at\n\t\tgithub_url\n\t\ttask_file_path\n\t\tagent_model\n\t\tagent_effort\n\t\tagent_machine\n\t\tagent_plan_first\n\t\tmin_hours\n\t\tmax_hours\n\t\tactual_hours\n\t\tcomment_hours\n\t\tclaude_usages_aggregate {\n\t\t\taggregate {\n\t\t\t\tsum {\n\t\t\t\t\tcost_usd\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tassignee {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t\tassignees {\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tassignee {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t\tlabels {\n\t\t\tlabel {\n\t\t\t\t...LabelFields\n\t\t\t}\n\t\t}\n\t\tcomments_aggregate {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t\tuploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tsubscribers {\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tsubscriber {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t\tlist {\n\t\t\tid\n\t\t\tname\n\t\t\tsort_order\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').TodoFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment TodoDetailFields on todos {\n\t\t...TodoFields\n\t\tcontent\n\t}\n"): typeof import('./graphql').TodoDetailFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ListFields on lists {\n\t\tid\n\t\tname\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t\tsort_order\n\t\t\tgithub\n\t\t}\n\t}\n"): typeof import('./graphql').ListFieldsFragmentDoc;
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
export function graphql(source: "\n\tfragment BoardFields on boards {\n\t\tid\n\t\tname\n\t\talias\n\t\tsort_order\n\t\tgithub\n\t\tis_public\n\t\tallow_public_comments\n\t\tsettings\n\t\tarchived_at\n\t\tclient_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tlabels {\n\t\t\t...LabelFields\n\t\t}\n\t\tuser {\n\t\t\tid\n\t\t\tusername\n\t\t\temail\n\t\t\tclaude_plan\n\t\t\tclaude_plan_monthly\n\t\t\tclaude_plan_currency\n\t\t}\n\t\tboard_members {\n\t\t\t...BoardMemberFields\n\t\t}\n\t\tclient {\n\t\t\tid\n\t\t\tname\n\t\t\tcompany_name\n\t\t\temail\n\t\t\tcurrency\n\t\t\tdefault_rate\n\t\t}\n\t}\n"): typeof import('./graphql').BoardFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment CommentFields on comments {\n\t\tid\n\t\tcontent\n\t\ttodo_id\n\t\tuser_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tgithub_comment_id\n\t\tgithub_synced_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t\temail\n\t\t}\n\t}\n"): typeof import('./graphql').CommentFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment LabelFields on labels {\n\t\tid\n\t\tname\n\t\tcolor\n\t\tsort_order\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').LabelFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment NoteCoreFields on notes {\n\t\tid\n\t\tboard_id\n\t\tuser_id\n\t\tparent_id\n\t\ttitle\n\t\tcontent\n\t\tcover_image_url\n\t\tsort_order\n\t\tcreated_at\n\t\tupdated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t\tnote_uploads {\n\t\t\tid\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t}\n"): typeof import('./graphql').NoteCoreFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment NoteFields on notes {\n\t\t...NoteCoreFields\n\t\tsubnotes(order_by: { sort_order: asc }) {\n\t\t\t...NoteCoreFields\n\t\t}\n\t}\n"): typeof import('./graphql').NoteFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment UserFields on users {\n\t\tid\n\t\tname\n\t\tusername\n\t\timage\n\t\temail\n\t\tlocale\n\t\tdark_mode\n\t\tsettings\n\t\tdefault_labels\n\t\temailVerified\n\t\tplan\n\t\tplan_expires_at\n\t\tclaude_plan\n\t\tclaude_plan_monthly\n\t\tclaude_plan_currency\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').UserFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetTodos(\n\t\t$where: todos_bool_exp = {}\n\t\t$order_by: [todos_order_by!] = { sort_order: asc, due_on: desc, updated_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\ttodos(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...TodoFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetTodoDetails($where: todos_bool_exp!) {\n\t\ttodos(where: $where, limit: 1) {\n\t\t\t...TodoDetailFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetTodoDetailsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery SearchTodoContent($where: todos_bool_exp!) {\n\t\ttodos(where: $where) {\n\t\t\tid\n\t\t}\n\t}\n"): typeof import('./graphql').SearchTodoContentDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery PollUnread($userId: uuid!) {\n\t\tnotifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').PollUnreadDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery PollBoard($userId: uuid!, $boardId: uuid!) {\n\t\tnotifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t\tboards_by_pk(id: $boardId) {\n\t\t\tupdated_at\n\t\t\tchanged_at\n\t\t}\n\t\t# Until the runner writes through the API (#231) and bumps changed_at, its card\n\t\t# creates and moves are seen through this one aggregate. Drop it in #231.\n\t\ttodos_aggregate(where: { list: { board_id: { _eq: $boardId } } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t\tmax {\n\t\t\t\t\tupdated_at\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').PollBoardDocument;
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
export function graphql(source: "\n\tquery GetNotes(\n\t\t$where: notes_bool_exp = {}\n\t\t$order_by: [notes_order_by!] = { sort_order: asc, created_at: desc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tnotes(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...NoteFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetNotesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateTodo($objects: [todos_insert_input!]!) {\n\t\tinsert_todos(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...TodoDetailFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {\n\t\tupdate_todos(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...TodoDetailFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteTodos($where: todos_bool_exp!) {\n\t\tdelete_todos(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteTodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateTaskFilePath($id: uuid!, $path: String) {\n\t\tupdate_todos_by_pk(pk_columns: { id: $id }, _set: { task_file_path: $path }) {\n\t\t\tid\n\t\t\ttask_file_path\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateTaskFilePathDocument;
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
export function graphql(source: "\n\tmutation CreateNote($objects: [notes_insert_input!]!) {\n\t\tinsert_notes(objects: $objects) {\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateNoteDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateNote($where: notes_bool_exp!, $_set: notes_set_input!) {\n\t\tupdate_notes(where: $where, _set: $_set) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateNoteDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateNotes($updates: [notes_updates!]!) {\n\t\tupdate_notes_many(updates: $updates) {\n\t\t\taffected_rows\n\t\t\treturning {\n\t\t\t\t...NoteFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateNotesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteNote($where: notes_bool_exp!) {\n\t\tdelete_notes(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteNoteDocument;
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
export function graphql(source: "\n\tquery GetNoteBoards($ids: [uuid!]!) {\n\t\tnotes(where: { id: { _in: $ids } }) {\n\t\t\tid\n\t\t\tboard_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetNoteBoardsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetNoteUploadNote($id: uuid!) {\n\t\tnote_uploads_by_pk(id: $id) {\n\t\t\tnote_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetNoteUploadNoteDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateNoteUpload($objects: [note_uploads_insert_input!]!) {\n\t\tinsert_note_uploads(objects: $objects) {\n\t\t\treturning {\n\t\t\t\tid\n\t\t\t\turl\n\t\t\t\tnote_id\n\t\t\t\tcreated_at\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').CreateNoteUploadDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteNoteUpload($where: note_uploads_bool_exp!) {\n\t\tdelete_note_uploads(where: $where) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteNoteUploadDocument;
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
export function graphql(source: "\n\tquery GetClaudeUsageMonth($user_id: uuid!, $from: timestamptz!, $to: timestamptz!) {\n\t\tclaude_usage_aggregate(\n\t\t\twhere: { user_id: { _eq: $user_id }, created_at: { _gte: $from, _lt: $to } }\n\t\t) {\n\t\t\taggregate {\n\t\t\t\tsum {\n\t\t\t\t\tcost_usd\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetClaudeUsageMonthDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetCommentsAggregate($where: comments_bool_exp = {}) {\n\t\tcomments_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetCommentsAggregateDocument;
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
export function graphql(source: "\n\tquery GetBoardRole($boardId: uuid!, $userId: uuid!) {\n\t\tboards_by_pk(id: $boardId) {\n\t\t\tuser_id\n\t\t\tis_public\n\t\t\tboard_members(where: { user_id: { _eq: $userId } }) {\n\t\t\t\trole\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardRoleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetListBoard($id: uuid!) {\n\t\tlists_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t\tname\n\t\t}\n\t}\n"): typeof import('./graphql').GetListBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetCardAccess($id: uuid!, $userId: uuid!) {\n\t\ttodos_by_pk(id: $id) {\n\t\t\tid\n\t\t\tuser_id\n\t\t\tlist_id\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tcompleted_at\n\t\t\tpriority\n\t\t\tdue_on\n\t\t\thas_time\n\t\t\tassigned_to\n\t\t\tmin_hours\n\t\t\tmax_hours\n\t\t\tactual_hours\n\t\t\tcomment_hours\n\t\t\ttask_file_path\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tassignees {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tsubscribers {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tlist {\n\t\t\t\tname\n\t\t\t\tboard_id\n\t\t\t\tboard {\n\t\t\t\t\tuser_id\n\t\t\t\t\tis_public\n\t\t\t\t\tboard_members(where: { user_id: { _eq: $userId } }) {\n\t\t\t\t\t\trole\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetCardAccessDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CardWritten(\n\t\t$boardIds: [uuid!]!\n\t\t$at: timestamptz!\n\t\t$logs: [activity_logs_insert_input!]!\n\t\t$notifications: [notifications_insert_input!]!\n\t) {\n\t\tupdate_boards(where: { id: { _in: $boardIds } }, _set: { changed_at: $at }) {\n\t\t\taffected_rows\n\t\t}\n\t\tinsert_activity_logs(objects: $logs) {\n\t\t\taffected_rows\n\t\t}\n\t\tinsert_notifications(objects: $notifications) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').CardWrittenDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetCommentAccess($id: uuid!) {\n\t\tcomments_by_pk(id: $id) {\n\t\t\tid\n\t\t\tuser_id\n\t\t\ttodo_id\n\t\t\tcontent\n\t\t}\n\t}\n"): typeof import('./graphql').GetCommentAccessDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetUploadTodo($id: uuid!) {\n\t\tuploads_by_pk(id: $id) {\n\t\t\ttodo_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetUploadTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation MarkMyNotificationsRead($userId: uuid!, $ids: [uuid!]!) {\n\t\tupdate_notifications(\n\t\t\twhere: { user_id: { _eq: $userId }, id: { _in: $ids } }\n\t\t\t_set: { is_read: true }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').MarkMyNotificationsReadDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteMyNotification($userId: uuid!, $id: uuid!) {\n\t\tdelete_notifications(where: { user_id: { _eq: $userId }, id: { _eq: $id } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteMyNotificationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetLabelBoard($id: uuid!) {\n\t\tlabels_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetLabelBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetMemberBoard($id: uuid!) {\n\t\tboard_members_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t\tuser_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetMemberBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetInvitationBoard($id: uuid!) {\n\t\tboard_invitations_by_pk(id: $id) {\n\t\t\tboard_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetInvitationBoardDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetUserIdentity($id: uuid!) {\n\t\tusers_by_pk(id: $id) {\n\t\t\temail\n\t\t\tusername\n\t\t}\n\t}\n"): typeof import('./graphql').GetUserIdentityDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetBoardMembers(\n\t\t$where: board_members_bool_exp = {}\n\t\t$order_by: [board_members_order_by!] = { created_at: asc }\n\t\t$limit: Int = 100\n\t\t$offset: Int = 0\n\t) {\n\t\tboard_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...BoardMemberFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardMembersDocument;
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
export function graphql(source: "\n\tquery GetMyInvitations($email: String!, $username: String!) {\n\t\tboard_invitations(\n\t\t\twhere: {\n\t\t\t\t_and: [\n\t\t\t\t\t{ status: { _eq: \"pending\" } }\n\t\t\t\t\t{ expires_at: { _gt: \"now()\" } }\n\t\t\t\t\t{ _or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }] }\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...BoardInvitationFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetMyInvitationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetInvitation($where: board_invitations_bool_exp!) {\n\t\tboard_invitations(where: $where, limit: 1) {\n\t\t\tid\n\t\t\tboard_id\n\t\t\trole\n\t\t\tstatus\n\t\t\tinvitee_email\n\t\t\tinvitee_username\n\t\t\texpires_at\n\t\t\tboard {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\talias\n\t\t\t\tuser {\n\t\t\t\t\tusername\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetInvitationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation AcceptInvitation($id: uuid!, $member: board_members_insert_input!) {\n\t\tinsert_board_members_one(\n\t\t\tobject: $member\n\t\t\ton_conflict: {\n\t\t\t\tconstraint: board_members_board_user_unique\n\t\t\t\tupdate_columns: [role]\n\t\t\t\twhere: { role: { _neq: \"owner\" } }\n\t\t\t}\n\t\t) {\n\t\t\tid\n\t\t}\n\t\tupdate_board_invitations_by_pk(pk_columns: { id: $id }, _set: { status: \"accepted\" }) {\n\t\t\tid\n\t\t}\n\t}\n"): typeof import('./graphql').AcceptInvitationDocument;
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
export function graphql(source: "\n\tquery GetPeople($userId: uuid!) {\n\t\tusers(\n\t\t\twhere: {\n\t\t\t\t_or: [\n\t\t\t\t\t{ id: { _eq: $userId } }\n\t\t\t\t\t{ boards: { board_members: { user_id: { _eq: $userId } } } }\n\t\t\t\t\t{\n\t\t\t\t\t\tboard_members: {\n\t\t\t\t\t\t\tboard: {\n\t\t\t\t\t\t\t\t_or: [\n\t\t\t\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t\t\t\t]\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t]\n\t\t\t}\n\t\t\torder_by: { name: asc }\n\t\t\tlimit: 500\n\t\t) {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n"): typeof import('./graphql').GetPeopleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetTodoByGithubIssue($githubIssueId: bigint!) {\n\t\ttodos(where: { github_issue_id: { _eq: $githubIssueId } }, limit: 1) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tcontent\n\t\t\tcompleted_at\n\t\t\tpriority\n\t\t\tassigned_to\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tgithub_synced_at\n\t\t\tassignees {\n\t\t\t\tuser_id\n\t\t\t}\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tuser_id\n\t\t\t\t\tgithub\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetTodoByGithubIssueDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetActivityLogByCommitSha($todoId: uuid!, $commitSha: jsonb!) {\n\t\tactivity_logs(\n\t\t\twhere: { todo_id: { _eq: $todoId }, changes: { _contains: $commitSha } }\n\t\t\tlimit: 1\n\t\t) {\n\t\t\tid\n\t\t}\n\t}\n"): typeof import('./graphql').GetActivityLogByCommitShaDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetCommentByGithubId($githubCommentId: bigint!) {\n\t\tcomments(where: { github_comment_id: { _eq: $githubCommentId } }, limit: 1) {\n\t\t\tid\n\t\t\tcontent\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tgithub_comment_id\n\t\t}\n\t}\n"): typeof import('./graphql').GetCommentByGithubIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetUserByGithubUsername($githubUsername: String!) {\n\t\tusers(\n\t\t\twhere: { settings: { _contains: { tokens: { github: { username: $githubUsername } } } } }\n\t\t\tlimit: 1\n\t\t) {\n\t\t\tid\n\t\t\tusername\n\t\t\tsettings\n\t\t}\n\t}\n"): typeof import('./graphql').GetUserByGithubUsernameDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateLogs($logs: [logs_insert_input!]!) {\n\t\tinsert_logs(objects: $logs) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').CreateLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteOldLogs($before: timestamptz!) {\n\t\tdelete_logs(where: { created_at: { _lt: $before } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteOldLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetLogs($where: logs_bool_exp, $order_by: [logs_order_by!], $limit: Int, $offset: Int) {\n\t\tlogs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\tid\n\t\t\ttimestamp\n\t\t\tlevel\n\t\t\tcomponent\n\t\t\tmessage\n\t\t\tdata\n\t\t\tuser_id\n\t\t\tsession_id\n\t\t\turl\n\t\t\tcreated_at\n\t\t}\n\t\tlogs_aggregate(where: $where) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment NotificationFields on notifications {\n\t\tid\n\t\tuser_id\n\t\ttodo_id\n\t\ttype\n\t\ttriggered_by_user_id\n\t\trelated_comment_id\n\t\tcontent\n\t\tis_read\n\t\tcreated_at\n\t\tupdated_at\n\t\ttriggered_by_user {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\ttodo {\n\t\t\tid\n\t\t\ttitle\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\talias\n\t\t\t\t\tuser {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tusername\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tnews {\n\t\t\tid\n\t\t\ttitle\n\t\t\tbody\n\t\t\turl\n\t\t}\n\t}\n"): typeof import('./graphql').NotificationFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetNotifications(\n\t\t$where: notifications_bool_exp\n\t\t$order_by: [notifications_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tnotifications(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...NotificationFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetNotificationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateNotification($notification: notifications_insert_input!) {\n\t\tinsert_notifications_one(object: $notification) {\n\t\t\t...NotificationFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateNotificationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreatePushSubscription($subscription: push_subscriptions_insert_input!) {\n\t\tinsert_push_subscriptions_one(\n\t\t\tobject: $subscription\n\t\t\ton_conflict: { constraint: push_subscriptions_endpoint_key, update_columns: [p256dh, auth, user_id] }\n\t\t) {\n\t\t\tid\n\t\t\tendpoint\n\t\t}\n\t}\n"): typeof import('./graphql').CreatePushSubscriptionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeletePushSubscription($endpoint: String!, $userId: uuid!) {\n\t\tdelete_push_subscriptions(\n\t\t\twhere: { endpoint: { _eq: $endpoint }, user_id: { _eq: $userId } }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeletePushSubscriptionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ActivityLogFields on activity_logs {\n\t\tid\n\t\tuser_id\n\t\ttodo_id\n\t\taction_type\n\t\tfield_name\n\t\told_value\n\t\tnew_value\n\t\tchanges\n\t\tcreated_at\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\ttodo {\n\t\t\tid\n\t\t\talias\n\t\t\ttitle\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tname\n\t\t\t\t\talias\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').ActivityLogFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetActivityLogs(\n\t\t$where: activity_logs_bool_exp\n\t\t$order_by: [activity_logs_order_by!]\n\t\t$limit: Int\n\t\t$offset: Int\n\t) {\n\t\tactivity_logs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {\n\t\t\t...ActivityLogFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetActivityLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateActivityLog($log: activity_logs_insert_input!) {\n\t\tinsert_activity_logs_one(object: $log) {\n\t\t\t...ActivityLogFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateActivityLogDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetTodoById($id: uuid!) {\n\t\ttodos_by_pk(id: $id) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tlist_id\n\t\t\tgithub_issue_number\n\t\t\tgithub_issue_id\n\t\t\tgithub_url\n\t\t\tlist {\n\t\t\t\tboard {\n\t\t\t\t\tid\n\t\t\t\t\tuser_id\n\t\t\t\t\tgithub\n\t\t\t\t\tlists(order_by: { sort_order: asc }) {\n\t\t\t\t\t\tid\n\t\t\t\t\t\tname\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetTodoByIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation SubscribeToTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tinsert_todo_subscribers_one(object: { todo_id: $todo_id, user_id: $user_id }) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tsubscriber {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').SubscribeToTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UnsubscribeFromTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tdelete_todo_subscribers_by_pk(todo_id: $todo_id, user_id: $user_id) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t}\n\t}\n"): typeof import('./graphql').UnsubscribeFromTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation AssignUserToTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tinsert_todo_assignees_one(\n\t\t\tobject: { todo_id: $todo_id, user_id: $user_id }\n\t\t\ton_conflict: { constraint: todo_assignees_pkey, update_columns: [] }\n\t\t) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t\tcreated_at\n\t\t\tassignee {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t\tusername\n\t\t\t\timage\n\t\t\t\temail\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').AssignUserToTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UnassignUserFromTodo($todo_id: uuid!, $user_id: uuid!) {\n\t\tdelete_todo_assignees_by_pk(todo_id: $todo_id, user_id: $user_id) {\n\t\t\ttodo_id\n\t\t\tuser_id\n\t\t}\n\t}\n"): typeof import('./graphql').UnassignUserFromTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ExpenseSplitFields on expense_splits {\n\t\tid\n\t\tuser_id\n\t\tamount\n\t\texpense_id\n\t\tuser {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n"): typeof import('./graphql').ExpenseSplitFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ExpenseFields on expenses {\n\t\tid\n\t\tamount\n\t\tdescription\n\t\tcreated_by\n\t\tboard_id\n\t\tcreated_at\n\t\tupdated_at\n\t\tdeleted_at\n\t\tcreated {\n\t\t\tid\n\t\t\tname\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t\texpense_splits {\n\t\t\t...ExpenseSplitFields\n\t\t}\n\t\tboard {\n\t\t\tid\n\t\t\tname\n\t\t\talias\n\t\t}\n\t}\n"): typeof import('./graphql').ExpenseFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetBoardExpenses($board_id: uuid!) {\n\t\texpenses(\n\t\t\twhere: { board_id: { _eq: $board_id }, deleted_at: { _is_null: true } }\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardExpensesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateExpense($object: expenses_insert_input!) {\n\t\tinsert_expenses_one(object: $object) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateExpenseDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteExpense($id: uuid!, $userId: uuid!, $deleted_at: timestamptz!) {\n\t\tupdate_expenses(\n\t\t\twhere: {\n\t\t\t\tid: { _eq: $id }\n\t\t\t\tcreated_by: { _eq: $userId }\n\t\t\t\tdeleted_at: { _is_null: true }\n\t\t\t\tboard: {\n\t\t\t\t\t_or: [\n\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t\t_set: { deleted_at: $deleted_at }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteExpenseDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment UrlShortcutFields on url_shortcuts {\n\t\tid\n\t\tuser_id\n\t\talias\n\t\ttarget_url\n\t\tvisit_count\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').UrlShortcutFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetUrlShortcuts($userId: uuid!) {\n\t\turl_shortcuts(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {\n\t\t\t...UrlShortcutFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetUrlShortcutsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetUrlShortcutByAlias($alias: String!) {\n\t\turl_shortcuts(where: { alias: { _eq: $alias } }, limit: 1) {\n\t\t\talias\n\t\t\ttarget_url\n\t\t}\n\t}\n"): typeof import('./graphql').GetUrlShortcutByAliasDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateUrlShortcut($object: url_shortcuts_insert_input!) {\n\t\tinsert_url_shortcuts_one(object: $object) {\n\t\t\t...UrlShortcutFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateUrlShortcutDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateUrlShortcut($id: uuid!, $userId: uuid!, $_set: url_shortcuts_set_input!) {\n\t\tupdate_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...UrlShortcutFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateUrlShortcutDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteUrlShortcut($id: uuid!, $userId: uuid!) {\n\t\tdelete_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteUrlShortcutDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation IncrementUrlShortcutVisits($alias: String!) {\n\t\tupdate_url_shortcuts(where: { alias: { _eq: $alias } }, _inc: { visit_count: 1 }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').IncrementUrlShortcutVisitsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetAllUserExpenses($userId: uuid!) {\n\t\texpenses(\n\t\t\twhere: {\n\t\t\t\tdeleted_at: { _is_null: true }\n\t\t\t\tboard: {\n\t\t\t\t\t_or: [\n\t\t\t\t\t\t{ user_id: { _eq: $userId } }\n\t\t\t\t\t\t{ board_members: { user_id: { _eq: $userId } } }\n\t\t\t\t\t]\n\t\t\t\t}\n\t\t\t}\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...ExpenseFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetAllUserExpensesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment ClientFields on clients {\n\t\tid\n\t\tuser_id\n\t\tlinked_user_id\n\t\tname\n\t\tcompany_name\n\t\temail\n\t\tphone\n\t\taddress\n\t\tvat_number\n\t\tcurrency\n\t\tdefault_rate\n\t\tnotes\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').ClientFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetClients($userId: uuid!) {\n\t\tclients(where: { user_id: { _eq: $userId } }, order_by: { name: asc }) {\n\t\t\t...ClientFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetClientsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateClient($object: clients_insert_input!) {\n\t\tinsert_clients_one(object: $object) {\n\t\t\t...ClientFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateClientDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateClient($id: uuid!, $userId: uuid!, $_set: clients_set_input!) {\n\t\tupdate_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...ClientFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateClientDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteClient($id: uuid!, $userId: uuid!) {\n\t\tdelete_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteClientDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment InvoiceCompanyFields on invoice_companies {\n\t\tid\n\t\tuser_id\n\t\tname\n\t\taddress\n\t\tvat_number\n\t\tvat_rate\n\t\tiban\n\t\tswift\n\t\tis_default\n\t\tcreated_at\n\t\tupdated_at\n\t}\n"): typeof import('./graphql').InvoiceCompanyFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetInvoiceCompanies($userId: uuid!) {\n\t\tinvoice_companies(where: { user_id: { _eq: $userId } }, order_by: [{ is_default: desc }, { name: asc }]) {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetInvoiceCompaniesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateInvoiceCompany($object: invoice_companies_insert_input!) {\n\t\tinsert_invoice_companies_one(object: $object) {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateInvoiceCompanyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateInvoiceCompany($id: uuid!, $userId: uuid!, $_set: invoice_companies_set_input!) {\n\t\tupdate_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {\n\t\t\treturning {\n\t\t\t\t...InvoiceCompanyFields\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateInvoiceCompanyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteInvoiceCompany($id: uuid!, $userId: uuid!) {\n\t\tdelete_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteInvoiceCompanyDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment InvoiceItemFields on invoice_items {\n\t\tid\n\t\tinvoice_id\n\t\ttodo_id\n\t\ttitle\n\t\thours\n\t\thourly_rate\n\t\tamount\n\t\tcreated_at\n\t}\n"): typeof import('./graphql').InvoiceItemFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tfragment InvoiceFields on invoices {\n\t\tid\n\t\tuser_id\n\t\tclient_id\n\t\tboard_id\n\t\tcompany_id\n\t\tinvoice_number\n\t\tissued_date\n\t\tdue_date\n\t\tcurrency\n\t\thourly_rate\n\t\ttotal_hours\n\t\ttotal_amount\n\t\tcustom_fields\n\t\tnotes\n\t\tstatus\n\t\tcreated_at\n\t\tupdated_at\n\t\tclient {\n\t\t\t...ClientFields\n\t\t}\n\t\tcompany {\n\t\t\t...InvoiceCompanyFields\n\t\t}\n\t\titems {\n\t\t\t...InvoiceItemFields\n\t\t}\n\t}\n"): typeof import('./graphql').InvoiceFieldsFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetBoardInvoices($board_id: uuid!, $userId: uuid!) {\n\t\tinvoices(\n\t\t\twhere: { board_id: { _eq: $board_id }, user_id: { _eq: $userId } }\n\t\t\torder_by: { created_at: desc }\n\t\t) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetBoardInvoicesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetAllInvoices($userId: uuid!) {\n\t\tinvoices(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n"): typeof import('./graphql').GetAllInvoicesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetInvoiceParties($clientId: uuid!, $companyId: uuid!, $userId: uuid!) {\n\t\tclients(where: { id: { _eq: $clientId }, user_id: { _eq: $userId } }) {\n\t\t\tid\n\t\t}\n\t\tinvoice_companies(where: { id: { _eq: $companyId }, user_id: { _eq: $userId } }) {\n\t\t\tid\n\t\t}\n\t}\n"): typeof import('./graphql').GetInvoicePartiesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateInvoiceWithItems($invoice: invoices_insert_input!) {\n\t\tinsert_invoices_one(object: $invoice) {\n\t\t\t...InvoiceFields\n\t\t}\n\t}\n"): typeof import('./graphql').CreateInvoiceWithItemsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetInvoicesIssuedToday($today: date!, $userId: uuid!) {\n\t\tinvoices_aggregate(where: { issued_date: { _eq: $today }, user_id: { _eq: $userId } }) {\n\t\t\taggregate {\n\t\t\t\tcount\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetInvoicesIssuedTodayDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation UpdateInvoiceStatus($id: uuid!, $userId: uuid!, $status: String!) {\n\t\tupdate_invoices(\n\t\t\twhere: { id: { _eq: $id }, user_id: { _eq: $userId } }\n\t\t\t_set: { status: $status }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').UpdateInvoiceStatusDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation DeleteInvoice($id: uuid!, $userId: uuid!) {\n\t\tdelete_invoice_items(\n\t\t\twhere: { invoice: { id: { _eq: $id }, user_id: { _eq: $userId } } }\n\t\t) {\n\t\t\taffected_rows\n\t\t}\n\t\tdelete_invoices(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {\n\t\t\taffected_rows\n\t\t}\n\t}\n"): typeof import('./graphql').DeleteInvoiceDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery GetTodosForInvoicing($where: todos_bool_exp!) {\n\t\ttodos(where: $where, order_by: { sort_order: asc }) {\n\t\t\tid\n\t\t\ttitle\n\t\t\tactual_hours\n\t\t\tlist_id\n\t\t\tcompleted_at\n\t\t\tlist {\n\t\t\t\tid\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n"): typeof import('./graphql').GetTodosForInvoicingDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation VerifyUserPassword($email: String!, $password: String!) {\n\t\tverify_user_password(args: { user_email: $email, user_password: $password }) {\n\t\t\tid\n\t\t\tname\n\t\t\temail\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n"): typeof import('./graphql').VerifyUserPasswordDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreatePasswordUser($email: String!, $name: String!, $password: String!) {\n\t\tcreate_password_user(args: { user_email: $email, user_name: $name, user_password: $password }) {\n\t\t\tid\n\t\t\tname\n\t\t\temail\n\t\t\tusername\n\t\t\timage\n\t\t}\n\t}\n"): typeof import('./graphql').CreatePasswordUserDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
