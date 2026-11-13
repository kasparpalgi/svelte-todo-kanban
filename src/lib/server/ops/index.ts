/** @file src/lib/server/ops/index.ts */
// Every op the browser can call as POST /api/data/<name>.
import { getBoardActivity } from './activity';
import { createBoard, deleteBoard, getBoard, getBoards, updateBoard } from './boards';
import {
	acceptInvitation,
	cancelInvitation,
	createBoardInvitation,
	declineInvitation,
	getBoardInvitations,
	getMyInvitations
} from './invitations';
import { addTodoLabel, createUpload, deleteUpload, removeTodoLabel } from './cardExtras';
import { assignUser, subscribeToTodo, unassignUser, unsubscribeFromTodo } from './cardPeople';
import { createComment, deleteComment, getComments, updateComment } from './comments';
import { createLabel, deleteLabel, updateLabel } from './labels';
import { createList, deleteList, getLists, updateList } from './lists';
import { createLog, getLogs } from './logs';
import { getBoardMembers, removeBoardMember, updateBoardMember } from './members';
import { deleteNotification, getNotifications, markNotificationsRead } from './notifications';
import { poll } from './poll';
import { createTodo, deleteTodo, getTodo, getTodos, searchTodos, updateTodo } from './todos';

export const ops = {
	createLog,
	getLogs,
	poll,
	getBoards,
	getBoard,
	createBoard,
	updateBoard,
	deleteBoard,
	getLists,
	createList,
	updateList,
	deleteList,
	createLabel,
	updateLabel,
	deleteLabel,
	getBoardMembers,
	updateBoardMember,
	removeBoardMember,
	getBoardInvitations,
	getMyInvitations,
	createBoardInvitation,
	cancelInvitation,
	acceptInvitation,
	declineInvitation,
	getTodos,
	getTodo,
	searchTodos,
	createTodo,
	updateTodo,
	deleteTodo,
	assignUser,
	unassignUser,
	subscribeToTodo,
	unsubscribeFromTodo,
	addTodoLabel,
	removeTodoLabel,
	createUpload,
	deleteUpload,
	getComments,
	createComment,
	updateComment,
	deleteComment,
	getNotifications,
	markNotificationsRead,
	deleteNotification,
	getBoardActivity
};

export type Ops = typeof ops;
export type OpName = keyof Ops;
