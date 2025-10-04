/** @file src/routes/+layout.server.ts */
import { PUBLIC_APP_ENV, PUBLIC_API_ENV } from '$env/static/public';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { request } from '$lib/graphql/client';
import { GET_BOARDS } from '$lib/graphql/documents';
import type { GetBoardsQuery } from '$lib/graphql/generated/graphql';

const allowedAppEnvs = ['production', 'testing', 'development'] as const;
const allowedApiEnvs = ['production', 'development'] as const;

type AppEnv = (typeof allowedAppEnvs)[number];
type ApiEnv = (typeof allowedApiEnvs)[number];

function isValidAppEnv(env: string): env is AppEnv {
	return allowedAppEnvs.includes(env as AppEnv);
}

function isValidApiEnv(env: string): env is ApiEnv {
	return allowedApiEnvs.includes(env as ApiEnv);
}

async function getTopBoardPath(session: any): Promise<string | null> {
	try {
		console.log('[Layout] === GETTING TOP BOARD ===');
		console.log('[Layout] Session user:', { id: session?.user?.id, email: session?.user?.email });

		const lastBoardAlias = session?.user?.settings?.lastBoardAlias;
		console.log('[Layout] Last board alias from settings:', lastBoardAlias);

		if (lastBoardAlias) {
			// Try to find the board with this alias
			const dataByAlias: GetBoardsQuery = await request(
				GET_BOARDS,
				{
					where: { alias: { _eq: lastBoardAlias } },
					limit: 1
				},
				session
			);

			console.log('[Layout] Board query by alias result:', dataByAlias);

			if (dataByAlias.boards && dataByAlias.boards.length > 0) {
				const board = dataByAlias.boards[0];
				console.log('[Layout] Found last opened board:', { alias: board.alias, username: board.user?.username });

				if (board.user?.username && board.alias) {
					const locale = session.user?.locale || 'en';
					const path = `/${locale}/${board.user.username}/${board.alias}`;
					console.log('[Layout] ✓ Redirecting to last opened board:', path);
					return path;
				}
			} else {
				console.log('[Layout] Last opened board not found, falling back to top board');
			}
		}

		// Fallback: Get the top board by sort order
		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			session
		);

		console.log('[Layout] Boards query result:', data);
		console.log('[Layout] Boards count:', data.boards?.length);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			console.log('[Layout] Top board:', { alias: board.alias, username: board.user?.username });

			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'en';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
				console.log('[Layout] ✓ Redirecting to top board:', path);
				return path;
			} else {
				console.warn('[Layout] ✗ Top board missing username or alias:', { username: board.user?.username, alias: board.alias });
			}
		} else {
			console.log('[Layout] ✗ No boards found');
		}

		return null;
	} catch (error) {
		console.error('[Layout] ✗ Error getting top board:', error);
		return null;
	}
}

export const load: LayoutServerLoad = async (event) => {
	const { url, locals } = event;

	const appEnv = isValidAppEnv(PUBLIC_APP_ENV) ? PUBLIC_APP_ENV : 'development';
	const apiEnv = isValidApiEnv(PUBLIC_API_ENV) ? PUBLIC_API_ENV : 'development';

	const env = {
		app: appEnv,
		api: apiEnv
	};

	const session = await locals.auth();

	console.log('[Root Layout] === LAYOUT SERVER LOAD ===');
	console.log('[Root Layout] Path:', url.pathname);
	console.log('[Root Layout] Has session:', !!session);
	console.log('[Root Layout] User:', session?.user ? { id: session.user.id, email: session.user.email } : 'none');

	if (url.pathname === '/') {
		if (!session) {
			console.log('[Root Layout] → Redirecting to /signin (no session)');
			throw redirect(302, '/signin');
		} else {
			const topBoardPath = await getTopBoardPath(session);
			if (topBoardPath) {
				console.log('[Root Layout] → Redirecting to top board:', topBoardPath);
				throw redirect(302, topBoardPath);
			} else {
				console.log('[Root Layout] → Redirecting to /en (no boards)');
				throw redirect(302, '/en');
			}
		}
	}

	if (url.pathname === '/auth/signin' && PUBLIC_APP_ENV !== 'development') {
		throw redirect(302, '/signin');
	}

	return {
		session,
		env
	};
};
