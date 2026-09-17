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

	const token = jwt.sign(
		{
			'https://hasura.io/jwt/claims': {
				'x-hasura-allowed-roles': ['user'],
				'x-hasura-default-role': 'user',
				'x-hasura-user-id': session.user.id,
				'x-hasura-user-email': session.user.email || '',
				'x-hasura-user-username': session.user.username || ''
			},
			sub: session.user.id,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 hours
		},
		AUTH_SECRET,
		{ algorithm: 'HS256' }
	);

	// No HTTP cache: the browser would cache this at the URL level, with no awareness
	// of which session cookie is active. After a user switch the old response gets
	// served back, giving the new session a JWT stamped with the previous user's ID.
	// Client-side caching (in-memory + localStorage in graphql/client.ts) is enough.
	return json({ token }, { headers: { 'Cache-Control': 'no-store' } });
};
