/** @file src/lib/graphql/documents.ts */
import { graphql } from './generated';

export const TODO_FRAGMENT = graphql(`
	fragment TodoFields on todos {
		id
		title
		content
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
		min_hours
		max_hours
		actual_hours
		comment_hours
		assignee {
			id
			name
			username
			image
			email
		}
		labels {
			label {
				...LabelFields
			}
		}
		comments(order_by: { created_at: asc }) {
			...CommentFields
		}
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
				alias
				sort_order
				github
				settings
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
		created_at
		updated_at
		labels {
			...LabelFields
		}
		user {
			id
			username
			email
		}
		board_members {
			...BoardMemberFields
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

export const ADD_BOARD_MEMBER = graphql(`
	mutation AddBoardMember($objects: [board_members_insert_input!]!) {
		insert_board_members(
			objects: $objects
			on_conflict: {
				constraint: board_members_board_user_unique
				update_columns: [role, updated_at]
			}
		) {
			affected_rows
			returning {
				...BoardMemberFields
			}
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
					{
						_or: [{ invitee_email: { _eq: $email } }, { invitee_username: { _eq: $username } }]
					}
				]
			}
			order_by: { created_at: desc }
		) {
			...BoardInvitationFields
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

export const SEARCH_USERS = graphql(`
	query SearchUsers($search: String!) {
		users(
			where: {
				_or: [
					{ email: { _ilike: $search } }
					{ username: { _ilike: $search } }
					{ name: { _ilike: $search } }
				]
			}
			limit: 10
		) {
			id
			name
			username
			email
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
			github_issue_number
			github_issue_id
			github_synced_at
			list {
				id
				board {
					id
					github
				}
			}
		}
	}
`);

export const GET_COMMENT_BY_GITHUB_ID = graphql(`
	query GetCommentByGithubId($githubCommentId: bigint!) {
		comments(where: { github_comment_id: { _eq: $githubCommentId } }, limit: 1) {
			id
			content
			todo_id
			github_comment_id
		}
	}
`);

// ========== Logging ==========

export const CREATE_LOG = graphql(`
	mutation CreateLog($log: logs_insert_input!) {
		insert_logs_one(object: $log) {
			id
			timestamp
			level
			component
			message
		}
	}
`);

export const GET_LOGS = graphql(`
	query GetLogs(
		$where: logs_bool_exp
		$order_by: [logs_order_by!]
		$limit: Int
		$offset: Int
	) {
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
		notifications_aggregate(where: $where) {
			aggregate {
				count
			}
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

export const UPDATE_NOTIFICATION = graphql(`
	mutation UpdateNotification($id: uuid!, $updates: notifications_set_input!) {
		update_notifications_by_pk(pk_columns: { id: $id }, _set: $updates) {
			...NotificationFields
		}
	}
`);

export const MARK_NOTIFICATIONS_AS_READ = graphql(`
	mutation MarkNotificationsAsRead($notification_ids: [uuid!]!) {
		update_notifications(where: { id: { _in: $notification_ids } }, _set: { is_read: true }) {
			affected_rows
		}
	}
`);

export const DELETE_NOTIFICATION = graphql(`
	mutation DeleteNotification($id: uuid!) {
		delete_notifications_by_pk(id: $id) {
			id
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
		activity_logs_aggregate(where: $where) {
			aggregate {
				count
			}
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

// ========== Tracker Sessions & Keywords ==========

export const TRACKER_SESSION_FRAGMENT = graphql(`
	fragment TrackerSessionFields on tracker_sessions {
		id
		window_title
		start_time
		end_time
		duration_seconds
		tracker_app {
			id
			name
		}
	}
`);

export const TRACKER_KEYWORD_FRAGMENT = graphql(`
	fragment TrackerKeywordFields on tracker_keywords {
		id
		board_id
		keyword
		case_sensitive
		board {
			id
			name
			alias
		}
		tracker_category {
			id
			name
			parent_category {
				id
				name
			}
			sub_categories {
				id
				name
			}
		}
	}
`);

export const GET_TRACKER_SESSIONS = graphql(`
	query GetTrackerSessions(
		$limit: Int = 15000
		$offset: Int = 0
		$order_by: [tracker_sessions_order_by!]
		$where: tracker_sessions_bool_exp
	) {
		tracker_sessions(
			limit: $limit
			offset: $offset
			order_by: $order_by
			where: $where
		) {
			...TrackerSessionFields
		}
		tracker_sessions_aggregate(where: $where) {
			aggregate {
				count
				sum {
					duration_seconds
				}
			}
		}
	}
`);

export const GET_TRACKER_KEYWORDS = graphql(`
	query GetTrackerKeywords(
		$limit: Int = 5000
		$offset: Int = 0
		$order_by: [tracker_keywords_order_by!]
		$where: tracker_keywords_bool_exp
	) {
		tracker_keywords(
			limit: $limit
			offset: $offset
			order_by: $order_by
			where: $where
		) {
			...TrackerKeywordFields
		}
	}
`);

export const GET_TRACKER_CATEGORIES = graphql(`
	query GetTrackerCategories(
		$limit: Int = 5000
		$offset: Int = 0
		$order_by: [tracker_categories_order_by!]
		$where: tracker_categories_bool_exp
	) {
		tracker_categories(
			limit: $limit
			offset: $offset
			order_by: $order_by
			where: $where
		) {
			id
			name
			parent_category {
				id
				name
			}
			sub_categories {
				id
				name
			}
			tracker_keywords {
				id
				keyword
				case_sensitive
				board_id
			}
		}
	}
`);
