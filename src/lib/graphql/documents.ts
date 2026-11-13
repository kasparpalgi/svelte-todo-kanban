/** @file src/lib/graphql/documents.ts */
import { graphql } from './generated';

// What the board needs per card (#211): no full body and no comments, which were most of
// a 3.6 MB board load. A card opening fetches TodoDetailFields via GET_TODO_DETAILS.
export const TODO_FRAGMENT = graphql(`
	fragment TodoFields on todos {
		id
		alias
		title
		content_preview
		due_on
		has_time
		sort_order
		priority
		list_id
		completed_at
		created_at
		updated_at
		assigned_to
		github_issue_number
		github_issue_id
		github_synced_at
		github_url
		task_file_path
		agent_model
		agent_effort
		agent_machine
		agent_plan_first
		min_hours
		max_hours
		actual_hours
		comment_hours
		claude_usages_aggregate {
			aggregate {
				sum {
					cost_usd
				}
			}
		}
		assignee {
			id
			name
			username
			image
			email
		}
		assignees {
			user_id
			created_at
			assignee {
				id
				name
				username
				image
				email
			}
		}
		labels {
			label {
				...LabelFields
			}
		}
		comments_aggregate {
			aggregate {
				count
			}
		}
		uploads {
			id
			url
			created_at
		}
		subscribers {
			user_id
			created_at
			subscriber {
				id
				name
				username
				image
				email
			}
		}
		list {
			id
			name
			sort_order
			board {
				id
			}
		}
	}
`);

export const TODO_DETAIL_FRAGMENT = graphql(`
	fragment TodoDetailFields on todos {
		...TodoFields
		content
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
			alias
			sort_order
			github
		}
	}
`);

export const BOARD_MEMBER_FRAGMENT = graphql(`
	fragment BoardMemberFields on board_members {
		id
		board_id
		user_id
		role
		created_at
		updated_at
		user {
			id
			name
			username
			email
			image
		}
	}
`);

export const BOARD_INVITATION_FRAGMENT = graphql(`
	fragment BoardInvitationFields on board_invitations {
		id
		board_id
		inviter_id
		invitee_email
		invitee_username
		role
		status
		token
		created_at
		updated_at
		expires_at
		inviter {
			id
			name
			username
			email
			image
		}
		board {
			id
			name
			alias
		}
	}
`);

export const BOARD_FRAGMENT = graphql(`
	fragment BoardFields on boards {
		id
		name
		alias
		sort_order
		github
		is_public
		allow_public_comments
		settings
		archived_at
		client_id
		created_at
		updated_at
		labels {
			...LabelFields
		}
		user {
			id
			username
			email
			claude_plan
			claude_plan_monthly
			claude_plan_currency
		}
		board_members {
			...BoardMemberFields
		}
		client {
			id
			name
			company_name
			email
			currency
			default_rate
		}
	}
`);

export const COMMENT_FRAGMENT = graphql(`
	fragment CommentFields on comments {
		id
		content
		todo_id
		user_id
		created_at
		updated_at
		github_comment_id
		github_synced_at
		user {
			id
			name
			username
			image
			email
		}
	}
`);

export const LABEL_FRAGMENT = graphql(`
	fragment LabelFields on labels {
		id
		name
		color
		sort_order
		board_id
		created_at
		updated_at
	}
`);

export const NOTE_CORE_FRAGMENT = graphql(`
	fragment NoteCoreFields on notes {
		id
		board_id
		user_id
		parent_id
		title
		content
		cover_image_url
		sort_order
		created_at
		updated_at
		user {
			id
			name
			username
			image
		}
		board {
			id
			name
			alias
		}
		note_uploads {
			id
			url
			created_at
		}
	}
`);

export const NOTE_FRAGMENT = graphql(`
	fragment NoteFields on notes {
		...NoteCoreFields
		subnotes(order_by: { sort_order: asc }) {
			...NoteCoreFields
		}
	}
`);

export const USER_FRAGMENT = graphql(`
	fragment UserFields on users {
		id
		name
		username
		image
		email
		locale
		dark_mode
		settings
		default_labels
		emailVerified
		plan
		plan_expires_at
		claude_plan
		claude_plan_monthly
		claude_plan_currency
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

export const GET_TODO_DETAILS = graphql(`
	query GetTodoDetails($where: todos_bool_exp!) {
		todos(where: $where, limit: 1) {
			...TodoDetailFields
		}
	}
`);

// "Search in content": the board holds no full bodies (#211), so the match runs in Postgres.
export const SEARCH_TODO_CONTENT = graphql(`
	query SearchTodoContent($where: todos_bool_exp!) {
		todos(where: $where) {
			id
		}
	}
`);

// Server only: the `poll` op (src/lib/server/ops/poll.ts). One board row (its
// `changed_at` stamp, #229) instead of a fingerprint of every card, so the browser gets
// a few bytes every 30 s and refetches the full board only on a change.
export const POLL_UNREAD = graphql(`
	query PollUnread($userId: uuid!) {
		notifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {
			aggregate {
				count
			}
		}
	}
`);

export const POLL_BOARD = graphql(`
	query PollBoard($userId: uuid!, $boardId: uuid!) {
		notifications_aggregate(where: { user_id: { _eq: $userId }, is_read: { _eq: false } }) {
			aggregate {
				count
			}
		}
		boards_by_pk(id: $boardId) {
			updated_at
			changed_at
		}
		# Until the runner writes through the API (#231) and bumps changed_at, its card
		# creates and moves are seen through this one aggregate. Drop it in #231.
		todos_aggregate(where: { list: { board_id: { _eq: $boardId } } }) {
			aggregate {
				count
				max {
					updated_at
				}
			}
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

export const GET_NOTES = graphql(`
	query GetNotes(
		$where: notes_bool_exp = {}
		$order_by: [notes_order_by!] = { sort_order: asc, created_at: desc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		notes(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...NoteFields
		}
	}
`);

export const CREATE_TODO = graphql(`
	mutation CreateTodo($objects: [todos_insert_input!]!) {
		insert_todos(objects: $objects) {
			returning {
				...TodoDetailFields
			}
		}
	}
`);

export const UPDATE_TODOS = graphql(`
	mutation UpdateTodos($where: todos_bool_exp!, $_set: todos_set_input!) {
		update_todos(where: $where, _set: $_set) {
			affected_rows
			returning {
				...TodoDetailFields
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

export const UPDATE_TASK_FILE_PATH = graphql(`
	mutation UpdateTaskFilePath($id: uuid!, $path: String) {
		update_todos_by_pk(pk_columns: { id: $id }, _set: { task_file_path: $path }) {
			id
			task_file_path
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

export const CREATE_NOTE = graphql(`
	mutation CreateNote($objects: [notes_insert_input!]!) {
		insert_notes(objects: $objects) {
			returning {
				...NoteFields
			}
		}
	}
`);

export const UPDATE_NOTE = graphql(`
	mutation UpdateNote($where: notes_bool_exp!, $_set: notes_set_input!) {
		update_notes(where: $where, _set: $_set) {
			affected_rows
			returning {
				...NoteFields
			}
		}
	}
`);

export const UPDATE_NOTES = graphql(`
	mutation UpdateNotes($updates: [notes_updates!]!) {
		update_notes_many(updates: $updates) {
			affected_rows
			returning {
				...NoteFields
			}
		}
	}
`);

export const DELETE_NOTE = graphql(`
	mutation DeleteNote($where: notes_bool_exp!) {
		delete_notes(where: $where) {
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

export const GET_NOTE_BOARDS = graphql(`
	query GetNoteBoards($ids: [uuid!]!) {
		notes(where: { id: { _in: $ids } }) {
			id
			board_id
		}
	}
`);

export const GET_NOTE_UPLOAD_NOTE = graphql(`
	query GetNoteUploadNote($id: uuid!) {
		note_uploads_by_pk(id: $id) {
			note_id
		}
	}
`);

export const CREATE_NOTE_UPLOAD = graphql(`
	mutation CreateNoteUpload($objects: [note_uploads_insert_input!]!) {
		insert_note_uploads(objects: $objects) {
			returning {
				id
				url
				note_id
				created_at
			}
		}
	}
`);

export const DELETE_NOTE_UPLOAD = graphql(`
	mutation DeleteNoteUpload($where: note_uploads_bool_exp!) {
		delete_note_uploads(where: $where) {
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

export const GET_COMMENTS = graphql(`
	query GetComments(
		$where: comments_bool_exp = {}
		$order_by: [comments_order_by!] = { created_at: asc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		comments(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...CommentFields
		}
	}
`);

export const GET_CLAUDE_USAGE_MONTH = graphql(`
	query GetClaudeUsageMonth($user_id: uuid!, $from: timestamptz!, $to: timestamptz!) {
		claude_usage_aggregate(
			where: { user_id: { _eq: $user_id }, created_at: { _gte: $from, _lt: $to } }
		) {
			aggregate {
				sum {
					cost_usd
				}
			}
		}
	}
`);

export const GET_COMMENTS_AGGREGATE = graphql(`
	query GetCommentsAggregate($where: comments_bool_exp = {}) {
		comments_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`);

export const CREATE_COMMENT = graphql(`
	mutation CreateComment($objects: [comments_insert_input!]!) {
		insert_comments(objects: $objects) {
			returning {
				...CommentFields
			}
		}
	}
`);

export const UPDATE_COMMENT = graphql(`
	mutation UpdateComment($where: comments_bool_exp!, $_set: comments_set_input!) {
		update_comments(where: $where, _set: $_set) {
			affected_rows
			returning {
				...CommentFields
			}
		}
	}
`);

export const DELETE_COMMENT = graphql(`
	mutation DeleteComment($where: comments_bool_exp!) {
		delete_comments(where: $where) {
			affected_rows
		}
	}
`);

export const ADD_TODO_LABEL = graphql(`
	mutation AddTodoLabel($objects: [todo_labels_insert_input!]!) {
		insert_todo_labels(objects: $objects) {
			affected_rows
		}
	}
`);

export const REMOVE_TODO_LABEL = graphql(`
	mutation RemoveTodoLabel($where: todo_labels_bool_exp!) {
		delete_todo_labels(where: $where) {
			affected_rows
		}
	}
`);

export const CREATE_LABEL = graphql(`
	mutation CreateLabel($objects: [labels_insert_input!]!) {
		insert_labels(objects: $objects) {
			returning {
				...LabelFields
			}
		}
	}
`);

export const UPDATE_LABEL = graphql(`
	mutation UpdateLabel($where: labels_bool_exp!, $_set: labels_set_input!) {
		update_labels(where: $where, _set: $_set) {
			affected_rows
			returning {
				...LabelFields
			}
		}
	}
`);

export const DELETE_LABEL = graphql(`
	mutation DeleteLabel($where: labels_bool_exp!) {
		delete_labels(where: $where) {
			affected_rows
		}
	}
`);

// Server only: src/lib/server/access.ts. Whether a user may see a board: owner,
// member or public, the same rule as the Hasura boards select permission.
export const GET_BOARD_ROLE = graphql(`
	query GetBoardRole($boardId: uuid!, $userId: uuid!) {
		boards_by_pk(id: $boardId) {
			user_id
			is_public
			board_members(where: { user_id: { _eq: $userId } }) {
				role
			}
		}
	}
`);

// Server only: which board a row belongs to, for the access check in its ops.
export const GET_LIST_BOARD = graphql(`
	query GetListBoard($id: uuid!) {
		lists_by_pk(id: $id) {
			board_id
			name
		}
	}
`);

// Server only: a card with its board's access fields, and the fields its activity log
// compares, in one read (src/lib/server/ops/cardAccess.ts).
export const GET_CARD_ACCESS = graphql(`
	query GetCardAccess($id: uuid!, $userId: uuid!) {
		todos_by_pk(id: $id) {
			id
			user_id
			list_id
			title
			content
			completed_at
			priority
			due_on
			has_time
			assigned_to
			min_hours
			max_hours
			actual_hours
			comment_hours
			task_file_path
			github_issue_number
			github_issue_id
			assignees {
				user_id
			}
			subscribers {
				user_id
			}
			list {
				name
				board_id
				board {
					user_id
					is_public
					board_members(where: { user_id: { _eq: $userId } }) {
						role
					}
				}
			}
		}
	}
`);

// Server only: after every card write, in one transaction: bump the boards' changed_at
// (what the poll compares, #229) and add the activity rows and notifications it caused.
export const CARD_WRITTEN = graphql(`
	mutation CardWritten(
		$boardIds: [uuid!]!
		$at: timestamptz!
		$logs: [activity_logs_insert_input!]!
		$notifications: [notifications_insert_input!]!
	) {
		update_boards(where: { id: { _in: $boardIds } }, _set: { changed_at: $at }) {
			affected_rows
		}
		insert_activity_logs(objects: $logs) {
			affected_rows
		}
		insert_notifications(objects: $notifications) {
			affected_rows
		}
	}
`);

export const GET_COMMENT_ACCESS = graphql(`
	query GetCommentAccess($id: uuid!) {
		comments_by_pk(id: $id) {
			id
			user_id
			todo_id
			content
		}
	}
`);

export const GET_UPLOAD_TODO = graphql(`
	query GetUploadTodo($id: uuid!) {
		uploads_by_pk(id: $id) {
			todo_id
		}
	}
`);

export const MARK_MY_NOTIFICATIONS_READ = graphql(`
	mutation MarkMyNotificationsRead($userId: uuid!, $ids: [uuid!]!) {
		update_notifications(
			where: { user_id: { _eq: $userId }, id: { _in: $ids } }
			_set: { is_read: true }
		) {
			affected_rows
		}
	}
`);

export const DELETE_MY_NOTIFICATION = graphql(`
	mutation DeleteMyNotification($userId: uuid!, $id: uuid!) {
		delete_notifications(where: { user_id: { _eq: $userId }, id: { _eq: $id } }) {
			affected_rows
		}
	}
`);

export const GET_LABEL_BOARD = graphql(`
	query GetLabelBoard($id: uuid!) {
		labels_by_pk(id: $id) {
			board_id
		}
	}
`);

export const GET_MEMBER_BOARD = graphql(`
	query GetMemberBoard($id: uuid!) {
		board_members_by_pk(id: $id) {
			board_id
			user_id
		}
	}
`);

export const GET_INVITATION_BOARD = graphql(`
	query GetInvitationBoard($id: uuid!) {
		board_invitations_by_pk(id: $id) {
			board_id
		}
	}
`);

// Server only: the email and username invitations are addressed to.
export const GET_USER_IDENTITY = graphql(`
	query GetUserIdentity($id: uuid!) {
		users_by_pk(id: $id) {
			email
			username
		}
	}
`);

// ========== Board Members ==========

export const GET_BOARD_MEMBERS = graphql(`
	query GetBoardMembers(
		$where: board_members_bool_exp = {}
		$order_by: [board_members_order_by!] = { created_at: asc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		board_members(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...BoardMemberFields
		}
	}
`);

export const UPDATE_BOARD_MEMBER = graphql(`
	mutation UpdateBoardMember($where: board_members_bool_exp!, $_set: board_members_set_input!) {
		update_board_members(where: $where, _set: $_set) {
			affected_rows
			returning {
				...BoardMemberFields
			}
		}
	}
`);

export const REMOVE_BOARD_MEMBER = graphql(`
	mutation RemoveBoardMember($where: board_members_bool_exp!) {
		delete_board_members(where: $where) {
			affected_rows
		}
	}
`);

// ========== Board Invitations ==========

export const GET_BOARD_INVITATIONS = graphql(`
	query GetBoardInvitations(
		$where: board_invitations_bool_exp = {}
		$order_by: [board_invitations_order_by!] = { created_at: desc }
		$limit: Int = 100
		$offset: Int = 0
	) {
		board_invitations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...BoardInvitationFields
		}
	}
`);

export const GET_MY_INVITATIONS = graphql(`
	query GetMyInvitations($email: String!, $username: String!) {
		board_invitations(
			where: {
				_and: [
					{ status: { _eq: "pending" } }
					{ expires_at: { _gt: "now()" } }
					{ _or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }] }
				]
			}
			order_by: { created_at: desc }
		) {
			...BoardInvitationFields
		}
	}
`);

// Server only: src/lib/server/ops/invitations.ts, by id or token.
export const GET_INVITATION = graphql(`
	query GetInvitation($where: board_invitations_bool_exp!) {
		board_invitations(where: $where, limit: 1) {
			id
			board_id
			role
			status
			invitee_email
			invitee_username
			expires_at
			board {
				id
				name
				alias
				user {
					username
				}
			}
		}
	}
`);

// Server only: joins the invitee and marks the invitation accepted, in one transaction.
// An existing member keeps their row, and an owner is never downgraded.
export const ACCEPT_INVITATION = graphql(`
	mutation AcceptInvitation($id: uuid!, $member: board_members_insert_input!) {
		insert_board_members_one(
			object: $member
			on_conflict: {
				constraint: board_members_board_user_unique
				update_columns: [role]
				where: { role: { _neq: "owner" } }
			}
		) {
			id
		}
		update_board_invitations_by_pk(pk_columns: { id: $id }, _set: { status: "accepted" }) {
			id
		}
	}
`);

export const CREATE_BOARD_INVITATION = graphql(`
	mutation CreateBoardInvitation($objects: [board_invitations_insert_input!]!) {
		insert_board_invitations(objects: $objects) {
			returning {
				...BoardInvitationFields
			}
		}
	}
`);

export const UPDATE_BOARD_INVITATION = graphql(`
	mutation UpdateBoardInvitation(
		$where: board_invitations_bool_exp!
		$_set: board_invitations_set_input!
	) {
		update_board_invitations(where: $where, _set: $_set) {
			affected_rows
			returning {
				...BoardInvitationFields
			}
		}
	}
`);

export const DELETE_BOARD_INVITATION = graphql(`
	mutation DeleteBoardInvitation($where: board_invitations_bool_exp!) {
		delete_board_invitations(where: $where) {
			affected_rows
		}
	}
`);

// ========== User Search ==========

export const GET_PEOPLE = graphql(`
	query GetPeople($userId: uuid!) {
		users(
			where: {
				_or: [
					{ id: { _eq: $userId } }
					{ boards: { board_members: { user_id: { _eq: $userId } } } }
					{
						board_members: {
							board: {
								_or: [
									{ user_id: { _eq: $userId } }
									{ board_members: { user_id: { _eq: $userId } } }
								]
							}
						}
					}
				]
			}
			order_by: { name: asc }
			limit: 500
		) {
			id
			name
			username
			image
		}
	}
`);

// ========== GitHub Webhooks ==========
export const GET_TODO_BY_GITHUB_ISSUE = graphql(`
	query GetTodoByGithubIssue($githubIssueId: bigint!) {
		todos(where: { github_issue_id: { _eq: $githubIssueId } }, limit: 1) {
			id
			title
			content
			completed_at
			priority
			assigned_to
			github_issue_number
			github_issue_id
			github_synced_at
			assignees {
				user_id
			}
			list {
				id
				board {
					id
					user_id
					github
				}
			}
		}
	}
`);

export const GET_ACTIVITY_LOG_BY_COMMIT_SHA = graphql(`
	query GetActivityLogByCommitSha($todoId: uuid!, $commitSha: jsonb!) {
		activity_logs(
			where: { todo_id: { _eq: $todoId }, changes: { _contains: $commitSha } }
			limit: 1
		) {
			id
		}
	}
`);

export const GET_COMMENT_BY_GITHUB_ID = graphql(`
	query GetCommentByGithubId($githubCommentId: bigint!) {
		comments(where: { github_comment_id: { _eq: $githubCommentId } }, limit: 1) {
			id
			content
			todo_id
			user_id
			github_comment_id
		}
	}
`);

export const GET_USER_BY_GITHUB_USERNAME = graphql(`
	query GetUserByGithubUsername($githubUsername: String!) {
		users(
			where: { settings: { _contains: { tokens: { github: { username: $githubUsername } } } } }
			limit: 1
		) {
			id
			username
			settings
		}
	}
`);

// ========== Logging ==========

// Server only: the browser goes through the createLog / getLogs ops
// (src/lib/server/ops/logs.ts).
export const CREATE_LOGS = graphql(`
	mutation CreateLogs($logs: [logs_insert_input!]!) {
		insert_logs(objects: $logs) {
			affected_rows
		}
	}
`);

export const DELETE_OLD_LOGS = graphql(`
	mutation DeleteOldLogs($before: timestamptz!) {
		delete_logs(where: { created_at: { _lt: $before } }) {
			affected_rows
		}
	}
`);

export const GET_LOGS = graphql(`
	query GetLogs($where: logs_bool_exp, $order_by: [logs_order_by!], $limit: Int, $offset: Int) {
		logs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			id
			timestamp
			level
			component
			message
			data
			user_id
			session_id
			url
			created_at
		}
		logs_aggregate(where: $where) {
			aggregate {
				count
			}
		}
	}
`);
// ========== Notifications ==========

export const NOTIFICATION_FRAGMENT = graphql(`
	fragment NotificationFields on notifications {
		id
		user_id
		todo_id
		type
		triggered_by_user_id
		related_comment_id
		content
		is_read
		created_at
		updated_at
		triggered_by_user {
			id
			name
			username
			image
		}
		todo {
			id
			title
			list {
				id
				board {
					id
					name
					alias
					user {
						id
						username
					}
				}
			}
		}
		news {
			id
			title
			body
			url
		}
	}
`);

export const GET_NOTIFICATIONS = graphql(`
	query GetNotifications(
		$where: notifications_bool_exp
		$order_by: [notifications_order_by!]
		$limit: Int
		$offset: Int
	) {
		notifications(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...NotificationFields
		}
	}
`);

export const CREATE_NOTIFICATION = graphql(`
	mutation CreateNotification($notification: notifications_insert_input!) {
		insert_notifications_one(object: $notification) {
			...NotificationFields
		}
	}
`);

// ========== Push Subscriptions ==========

export const CREATE_PUSH_SUBSCRIPTION = graphql(`
	mutation CreatePushSubscription($subscription: push_subscriptions_insert_input!) {
		insert_push_subscriptions_one(
			object: $subscription
			on_conflict: {
				constraint: push_subscriptions_endpoint_key
				update_columns: [p256dh, auth, user_id]
			}
		) {
			id
			endpoint
		}
	}
`);

export const DELETE_PUSH_SUBSCRIPTION = graphql(`
	mutation DeletePushSubscription($endpoint: String!, $userId: uuid!) {
		delete_push_subscriptions(where: { endpoint: { _eq: $endpoint }, user_id: { _eq: $userId } }) {
			affected_rows
		}
	}
`);

// ========== Activity Logs ==========

export const ACTIVITY_LOG_FRAGMENT = graphql(`
	fragment ActivityLogFields on activity_logs {
		id
		user_id
		todo_id
		action_type
		field_name
		old_value
		new_value
		changes
		created_at
		user {
			id
			name
			username
			image
		}
		todo {
			id
			alias
			title
			list {
				id
				name
				board {
					id
					name
					alias
				}
			}
		}
	}
`);

export const GET_ACTIVITY_LOGS = graphql(`
	query GetActivityLogs(
		$where: activity_logs_bool_exp
		$order_by: [activity_logs_order_by!]
		$limit: Int
		$offset: Int
	) {
		activity_logs(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
			...ActivityLogFields
		}
	}
`);

export const CREATE_ACTIVITY_LOG = graphql(`
	mutation CreateActivityLog($log: activity_logs_insert_input!) {
		insert_activity_logs_one(object: $log) {
			...ActivityLogFields
		}
	}
`);

// ========== Task file webhook queries ==========

export const GET_TODO_BY_ID = graphql(`
	query GetTodoById($id: uuid!) {
		todos_by_pk(id: $id) {
			id
			title
			list_id
			github_issue_number
			github_issue_id
			github_url
			list {
				board {
					id
					user_id
					github
					lists(order_by: { sort_order: asc }) {
						id
						name
					}
				}
			}
		}
	}
`);

// Raw string, kept out of codegen. `github` is a *text* column holding JSON, not
// jsonb — `_contains` is a runtime error on it, so match the full_name as a substring.
// Pass $fullName already wrapped in %…%.
export const GET_BOARD_BY_REPO = `
	query GetBoardByRepo($fullName: String!) {
		boards(where: { github: { _ilike: $fullName } }, limit: 1) {
			id
			user_id
			lists(order_by: { sort_order: asc }) {
				id
				name
			}
		}
	}
`;

// ========== Todo Subscribers ==========

export const SUBSCRIBE_TO_TODO = graphql(`
	mutation SubscribeToTodo($todo_id: uuid!, $user_id: uuid!) {
		insert_todo_subscribers_one(object: { todo_id: $todo_id, user_id: $user_id }) {
			todo_id
			user_id
			created_at
			subscriber {
				id
				name
				username
				image
				email
			}
		}
	}
`);

export const UNSUBSCRIBE_FROM_TODO = graphql(`
	mutation UnsubscribeFromTodo($todo_id: uuid!, $user_id: uuid!) {
		delete_todo_subscribers_by_pk(todo_id: $todo_id, user_id: $user_id) {
			todo_id
			user_id
		}
	}
`);

export const ASSIGN_USER_TO_TODO = graphql(`
	mutation AssignUserToTodo($todo_id: uuid!, $user_id: uuid!) {
		insert_todo_assignees_one(
			object: { todo_id: $todo_id, user_id: $user_id }
			on_conflict: { constraint: todo_assignees_pkey, update_columns: [] }
		) {
			todo_id
			user_id
			created_at
			assignee {
				id
				name
				username
				image
				email
			}
		}
	}
`);

export const UNASSIGN_USER_FROM_TODO = graphql(`
	mutation UnassignUserFromTodo($todo_id: uuid!, $user_id: uuid!) {
		delete_todo_assignees_by_pk(todo_id: $todo_id, user_id: $user_id) {
			todo_id
			user_id
		}
	}
`);

// ========== Expenses ==========

export const EXPENSE_SPLIT_FRAGMENT = graphql(`
	fragment ExpenseSplitFields on expense_splits {
		id
		user_id
		amount
		expense_id
		user {
			id
			name
			username
			image
		}
	}
`);

export const EXPENSE_FRAGMENT = graphql(`
	fragment ExpenseFields on expenses {
		id
		amount
		description
		created_by
		board_id
		created_at
		updated_at
		deleted_at
		created {
			id
			name
			username
			image
		}
		expense_splits {
			...ExpenseSplitFields
		}
		board {
			id
			name
			alias
		}
	}
`);

export const GET_BOARD_EXPENSES = graphql(`
	query GetBoardExpenses($board_id: uuid!) {
		expenses(
			where: { board_id: { _eq: $board_id }, deleted_at: { _is_null: true } }
			order_by: { created_at: desc }
		) {
			...ExpenseFields
		}
	}
`);

export const CREATE_EXPENSE = graphql(`
	mutation CreateExpense($object: expenses_insert_input!) {
		insert_expenses_one(object: $object) {
			...ExpenseFields
		}
	}
`);

export const DELETE_EXPENSE = graphql(`
	mutation DeleteExpense($id: uuid!, $userId: uuid!, $deleted_at: timestamptz!) {
		update_expenses(
			where: {
				id: { _eq: $id }
				created_by: { _eq: $userId }
				deleted_at: { _is_null: true }
				board: {
					_or: [{ user_id: { _eq: $userId } }, { board_members: { user_id: { _eq: $userId } } }]
				}
			}
			_set: { deleted_at: $deleted_at }
		) {
			affected_rows
		}
	}
`);

// ========== URL Shortcuts ==========

export const URL_SHORTCUT_FRAGMENT = graphql(`
	fragment UrlShortcutFields on url_shortcuts {
		id
		user_id
		alias
		target_url
		visit_count
		created_at
		updated_at
	}
`);

export const GET_URL_SHORTCUTS = graphql(`
	query GetUrlShortcuts($userId: uuid!) {
		url_shortcuts(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {
			...UrlShortcutFields
		}
	}
`);

export const GET_URL_SHORTCUT_BY_ALIAS = graphql(`
	query GetUrlShortcutByAlias($alias: String!) {
		url_shortcuts(where: { alias: { _eq: $alias } }, limit: 1) {
			alias
			target_url
		}
	}
`);

export const CREATE_URL_SHORTCUT = graphql(`
	mutation CreateUrlShortcut($object: url_shortcuts_insert_input!) {
		insert_url_shortcuts_one(object: $object) {
			...UrlShortcutFields
		}
	}
`);

export const UPDATE_URL_SHORTCUT = graphql(`
	mutation UpdateUrlShortcut($id: uuid!, $userId: uuid!, $_set: url_shortcuts_set_input!) {
		update_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {
			returning {
				...UrlShortcutFields
			}
		}
	}
`);

export const DELETE_URL_SHORTCUT = graphql(`
	mutation DeleteUrlShortcut($id: uuid!, $userId: uuid!) {
		delete_url_shortcuts(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {
			affected_rows
		}
	}
`);

export const INCREMENT_URL_SHORTCUT_VISITS = graphql(`
	mutation IncrementUrlShortcutVisits($alias: String!) {
		update_url_shortcuts(where: { alias: { _eq: $alias } }, _inc: { visit_count: 1 }) {
			affected_rows
		}
	}
`);

// ========== Splitwise (cross-board expense aggregation) ==========

export const GET_ALL_USER_EXPENSES = graphql(`
	query GetAllUserExpenses($userId: uuid!) {
		expenses(
			where: {
				deleted_at: { _is_null: true }
				board: {
					_or: [{ user_id: { _eq: $userId } }, { board_members: { user_id: { _eq: $userId } } }]
				}
			}
			order_by: { created_at: desc }
		) {
			...ExpenseFields
		}
	}
`);

// ========== Clients ==========

export const CLIENT_FRAGMENT = graphql(`
	fragment ClientFields on clients {
		id
		user_id
		linked_user_id
		name
		company_name
		email
		phone
		address
		vat_number
		currency
		default_rate
		notes
		created_at
		updated_at
	}
`);

export const GET_CLIENTS = graphql(`
	query GetClients($userId: uuid!) {
		clients(where: { user_id: { _eq: $userId } }, order_by: { name: asc }) {
			...ClientFields
		}
	}
`);

export const CREATE_CLIENT = graphql(`
	mutation CreateClient($object: clients_insert_input!) {
		insert_clients_one(object: $object) {
			...ClientFields
		}
	}
`);

export const UPDATE_CLIENT = graphql(`
	mutation UpdateClient($id: uuid!, $userId: uuid!, $_set: clients_set_input!) {
		update_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {
			returning {
				...ClientFields
			}
		}
	}
`);

export const DELETE_CLIENT = graphql(`
	mutation DeleteClient($id: uuid!, $userId: uuid!) {
		delete_clients(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {
			affected_rows
		}
	}
`);

// ========== Invoices ==========

export const INVOICE_COMPANY_FRAGMENT = graphql(`
	fragment InvoiceCompanyFields on invoice_companies {
		id
		user_id
		name
		address
		vat_number
		vat_rate
		iban
		swift
		is_default
		created_at
		updated_at
	}
`);

export const GET_INVOICE_COMPANIES = graphql(`
	query GetInvoiceCompanies($userId: uuid!) {
		invoice_companies(
			where: { user_id: { _eq: $userId } }
			order_by: [{ is_default: desc }, { name: asc }]
		) {
			...InvoiceCompanyFields
		}
	}
`);

export const CREATE_INVOICE_COMPANY = graphql(`
	mutation CreateInvoiceCompany($object: invoice_companies_insert_input!) {
		insert_invoice_companies_one(object: $object) {
			...InvoiceCompanyFields
		}
	}
`);

export const UPDATE_INVOICE_COMPANY = graphql(`
	mutation UpdateInvoiceCompany($id: uuid!, $userId: uuid!, $_set: invoice_companies_set_input!) {
		update_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }, _set: $_set) {
			returning {
				...InvoiceCompanyFields
			}
		}
	}
`);

export const DELETE_INVOICE_COMPANY = graphql(`
	mutation DeleteInvoiceCompany($id: uuid!, $userId: uuid!) {
		delete_invoice_companies(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {
			affected_rows
		}
	}
`);

export const INVOICE_ITEM_FRAGMENT = graphql(`
	fragment InvoiceItemFields on invoice_items {
		id
		invoice_id
		todo_id
		title
		hours
		hourly_rate
		amount
		created_at
	}
`);

export const INVOICE_FRAGMENT = graphql(`
	fragment InvoiceFields on invoices {
		id
		user_id
		client_id
		board_id
		company_id
		invoice_number
		issued_date
		due_date
		currency
		hourly_rate
		total_hours
		total_amount
		custom_fields
		notes
		status
		created_at
		updated_at
		client {
			...ClientFields
		}
		company {
			...InvoiceCompanyFields
		}
		items {
			...InvoiceItemFields
		}
	}
`);

export const GET_BOARD_INVOICES = graphql(`
	query GetBoardInvoices($board_id: uuid!, $userId: uuid!) {
		invoices(
			where: { board_id: { _eq: $board_id }, user_id: { _eq: $userId } }
			order_by: { created_at: desc }
		) {
			...InvoiceFields
		}
	}
`);

export const GET_ALL_INVOICES = graphql(`
	query GetAllInvoices($userId: uuid!) {
		invoices(where: { user_id: { _eq: $userId } }, order_by: { created_at: desc }) {
			...InvoiceFields
		}
	}
`);

export const GET_INVOICE_PARTIES = graphql(`
	query GetInvoiceParties($clientId: uuid!, $companyId: uuid!, $userId: uuid!) {
		clients(where: { id: { _eq: $clientId }, user_id: { _eq: $userId } }) {
			id
		}
		invoice_companies(where: { id: { _eq: $companyId }, user_id: { _eq: $userId } }) {
			id
		}
	}
`);

export const CREATE_INVOICE_WITH_ITEMS = graphql(`
	mutation CreateInvoiceWithItems($invoice: invoices_insert_input!) {
		insert_invoices_one(object: $invoice) {
			...InvoiceFields
		}
	}
`);

export const GET_INVOICES_ISSUED_TODAY = graphql(`
	query GetInvoicesIssuedToday($today: date!, $userId: uuid!) {
		invoices_aggregate(where: { issued_date: { _eq: $today }, user_id: { _eq: $userId } }) {
			aggregate {
				count
			}
		}
	}
`);

export const UPDATE_INVOICE_STATUS = graphql(`
	mutation UpdateInvoiceStatus($id: uuid!, $userId: uuid!, $status: String!) {
		update_invoices(
			where: { id: { _eq: $id }, user_id: { _eq: $userId } }
			_set: { status: $status }
		) {
			affected_rows
		}
	}
`);

export const DELETE_INVOICE = graphql(`
	mutation DeleteInvoice($id: uuid!, $userId: uuid!) {
		delete_invoice_items(where: { invoice: { id: { _eq: $id }, user_id: { _eq: $userId } } }) {
			affected_rows
		}
		delete_invoices(where: { id: { _eq: $id }, user_id: { _eq: $userId } }) {
			affected_rows
		}
	}
`);

export const GET_TODOS_FOR_INVOICING = graphql(`
	query GetTodosForInvoicing($where: todos_bool_exp!) {
		todos(where: $where, order_by: { sort_order: asc }) {
			id
			title
			actual_hours
			list_id
			completed_at
			list {
				id
				name
			}
		}
	}
`);

// Password sign-in / sign-up: Postgres hashes and checks the password (#217). Admin only.
export const VERIFY_USER_PASSWORD = graphql(`
	mutation VerifyUserPassword($email: String!, $password: String!) {
		verify_user_password(args: { user_email: $email, user_password: $password }) {
			id
			name
			email
			username
			image
		}
	}
`);

// Server only (admin secret): the stored hash, to tell PBKDF2 from bcrypt (#230).
export const GET_PASSWORD_USER = graphql(`
	query GetPasswordUser($email: String!) {
		users(where: { email: { _eq: $email } }, limit: 1) {
			id
			name
			email
			username
			image
			password
		}
	}
`);

export const SET_PASSWORD_HASH = graphql(`
	mutation SetPasswordHash($id: uuid!, $password: String!) {
		update_users_by_pk(pk_columns: { id: $id }, _set: { password: $password }) {
			id
		}
	}
`);

export const CREATE_PASSWORD_USER = graphql(`
	mutation CreatePasswordUser($email: String!, $name: String!, $password: String!) {
		create_password_user(args: { user_email: $email, user_name: $name, user_password: $password }) {
			id
			name
			email
			username
			image
		}
	}
`);
