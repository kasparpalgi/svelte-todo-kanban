/** @file src/routes/api/auth/token/+server.ts */
import { AUTH_SECRET } from '$env/static/private';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();

	if (!session?.user?.id) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Create a JWT token with Hasura claims
	const token = jwt.sign(
		{
			'https://hasura.io/jwt/claims': {
				'x-hasura-allowed-roles': ['user'],
				'x-hasura-default-role': 'user',
				'x-hasura-user-id': session.user.id
			},
			sub: session.user.id,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
		},
		AUTH_SECRET,
		{ algorithm: 'HS256' }
	);

	return json({ token });
};
