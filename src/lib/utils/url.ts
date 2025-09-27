/** @file src/lib/utils/url.ts */
import type { BoardFieldsFragment } from '$lib/graphql/generated/graphql';

export function generateBoardUrl(board: BoardFieldsFragment, lang: string = 'en'): string {
	if (!board.user?.username || !board.alias) {
		return `/${lang}`;
	}
	return `/${lang}/${board.user.username}/${board.alias}`;
}

export function parseBoardFromUrl(params: { lang?: string; username?: string; board?: string }) {
	return {
		lang: params.lang || 'en',
		username: params.username,
		boardAlias: params.board
	};
}

export function hasBoardInUrl(params: { username?: string; board?: string }): boolean {
	return !!(params.username && params.board);
}
