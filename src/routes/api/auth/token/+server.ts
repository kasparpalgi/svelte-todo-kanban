/** @file src/routes/api/auth/token/+server.ts */
import { AUTH_SECRET } from '$env/static/private';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { serverRequest } from '$lib/graphql/server-client';
import type { RequestHandler } from './$types';

const USER_EXISTS = `
	query UserExists($id: uuid!) {
		users_by_pk(id: $id) {
			id
		}
	}
`;

export const GET: RequestHandler = async (event) => {
	const session = await event.locals.auth();

	if (!session?.user?.id) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// A `strategy: 'jwt'` session cookie is valid for 90 days and its user id is
	// never re-checked against the DB. If that id belongs to a deleted/merged user
	// (e.g. after account merge #193), minting a Hasura token for it would silently
	// scope every query to only `is_public` boards. Reject it so the client clears
	// its cache and the user re-authenticates into the surviving account.
	// Fail OPEN on any lookup error — never lock out a legitimate user over a blip.
	try {
		const result = await serverRequest<{ users_by_pk: { id: string } | null }, { id: string }>(
			USER_EXISTS,
			{ id: session.user.id }
		);
		if (!result.users_by_pk) {
			return json({ error: 'User no longer exists' }, { status: 401 });
		}
	} catch (err) {
		console.error('[auth/token] user existence check failed, minting anyway:', err);
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
