/** @file src/lib/server/ops/index.ts */
// Every op the browser can call as POST /api/data/<name>.
import { createBoard, deleteBoard, getBoard, getBoards, updateBoard } from './boards';
import {
	acceptInvitation,
	cancelInvitation,
	createBoardInvitation,
	declineInvitation,
	getBoardInvitations,
	getMyInvitations
} from './invitations';
import { createLabel, deleteLabel, updateLabel } from './labels';
import { createList, deleteList, getLists, updateList } from './lists';
import { createLog, getLogs } from './logs';
import { getBoardMembers, removeBoardMember, updateBoardMember } from './members';
import { poll } from './poll';

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
	declineInvitation
};

export type Ops = typeof ops;
export type OpName = keyof Ops;
