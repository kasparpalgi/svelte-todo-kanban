/** @file src/lib/graphql/client.ts */
import { GraphQLClient } from 'graphql-request';
import { PUBLIC_API_ENDPOINT, PUBLIC_API_ENDPOINT_DEV, PUBLIC_API_ENV } from '$env/static/public';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? PUBLIC_API_ENDPOINT : PUBLIC_API_ENDPOINT_DEV;
const client = new GraphQLClient(apiEndpoint);

async function getJWTToken(): Promise<string> {
	const response = await fetch('/api/auth/token');
	if (!response.ok) {
		throw new Error('Failed to get JWT token');
	}
	const data = await response.json();
	return data.token;
}

export async function request<TResult, TVariables = any>(
	document: { toString(): string },
	variables?: TVariables,
	customHeaders?: HeadersInit
): Promise<TResult> {
	try {
		const token = await getJWTToken();
		console.log('token: ', token);
		const headers = {
			Authorization: `Bearer ${token}`,
			...customHeaders
		};

		const query = document.toString();

		return await client.request(query, variables as any, headers);
	} catch (error) {
		console.error('GraphQL request error:', error);
		throw error;
	}
}
