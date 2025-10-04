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
		console.log('=== GETTING TOP BOARD ===');
		console.log('Session user:', session?.user);

		const data: GetBoardsQuery = await request(
			GET_BOARDS,
			{
				order_by: [{ sort_order: 'asc' }, { name: 'asc' }],
				limit: 1
			},
			session
		);

		console.log('Boards query result:', data);
		console.log('Boards count:', data.boards?.length);

		if (data.boards && data.boards.length > 0) {
			const board = data.boards[0];
			console.log('Top board:', board);

			if (board.user?.username && board.alias) {
				const locale = session.user?.locale || 'en';
				const path = `/${locale}/${board.user.username}/${board.alias}`;
				console.log('✓ Redirecting to top board:', path);
				return path;
			} else {
				console.warn('✗ Top board missing username or alias:', { username: board.user?.username, alias: board.alias });
			}
		} else {
			console.log('✗ No boards found');
		}

		return null;
	} catch (error) {
		console.error('✗ Error getting top board:', error);
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

	console.log('=== LAYOUT SERVER LOAD ===');
	console.log('Path:', url.pathname);
	console.log('Has session:', !!session);

	if (url.pathname === '/') {
		if (!session) {
			console.log('→ Redirecting to /signin (no session)');
			throw redirect(302, '/signin');
		} else {
			const topBoardPath = await getTopBoardPath(session);
			if (topBoardPath) {
				console.log('→ Redirecting to top board:', topBoardPath);
				throw redirect(302, topBoardPath);
			} else {
				console.log('→ Redirecting to /en (no boards)');
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
