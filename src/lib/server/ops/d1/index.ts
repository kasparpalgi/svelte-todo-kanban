/** @file src/lib/server/ops/d1/index.ts */
// The ops that have a D1 version, each loaded when called. With `DATA_BACKEND=d1` an op
// missing here answers 501, so a half-ported staging Worker never reads Hasura (#233, #247).
import type { D1Runs } from './types';

type Loaders = { [K in keyof D1Runs]: () => Promise<NonNullable<D1Runs[K]>> };

export const d1Loaders: Loaders = {
	createLog: () => import('./logs').then((m) => m.createLog),
	getLogs: () => import('./logs').then((m) => m.getLogs),
	poll: () => import('./poll').then((m) => m.poll),
	getBoards: () => import('./boards').then((m) => m.getBoards),
	getBoard: () => import('./boards').then((m) => m.getBoard),
	createBoard: () => import('./boards').then((m) => m.createBoard),
	updateBoard: () => import('./boards').then((m) => m.updateBoard),
	deleteBoard: () => import('./boards').then((m) => m.deleteBoard),
	getLists: () => import('./lists').then((m) => m.getLists),
	createList: () => import('./lists').then((m) => m.createList),
	updateList: () => import('./lists').then((m) => m.updateList),
	deleteList: () => import('./lists').then((m) => m.deleteList),
	createLabel: () => import('./labels').then((m) => m.createLabel),
	updateLabel: () => import('./labels').then((m) => m.updateLabel),
	deleteLabel: () => import('./labels').then((m) => m.deleteLabel),
	getBoardMembers: () => import('./members').then((m) => m.getBoardMembers),
	updateBoardMember: () => import('./members').then((m) => m.updateBoardMember),
	removeBoardMember: () => import('./members').then((m) => m.removeBoardMember),
	getBoardInvitations: () => import('./invitations').then((m) => m.getBoardInvitations),
	getMyInvitations: () => import('./invitations').then((m) => m.getMyInvitations),
	createBoardInvitation: () => import('./invitations').then((m) => m.createBoardInvitation),
	cancelInvitation: () => import('./invitations').then((m) => m.cancelInvitation),
	acceptInvitation: () => import('./invitations').then((m) => m.acceptInvitation),
	declineInvitation: () => import('./invitations').then((m) => m.declineInvitation)
};
