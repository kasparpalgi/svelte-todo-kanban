/** @file src/lib/graphql/server-client.ts  */
import { API_ENDPOINT, HASURA_ADMIN_SECRET } from '$env/static/private';
import type { TypedDocumentString } from '$lib/graphql/generated/graphql';

export async function serverRequest<TResult, TVariables>(
	query: string | TypedDocumentString<TResult, TVariables>,
	variables?: TVariables
) {
	const queryString = typeof query === 'string' ? query : query.toString();

	const response = await fetch(API_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-hasura-admin-secret': HASURA_ADMIN_SECRET
		},
		body: JSON.stringify({
			query: queryString,
			variables
		})
	});

	const result = await response.json();

	if (result.errors) {
		throw new Error(result.errors[0]?.message || 'GraphQL error');
	}

	return result.data as TResult;
}
