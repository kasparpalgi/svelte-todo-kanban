/** @file src/lib/graphql/client.ts */
import { GraphQLClient } from 'graphql-request';
import { PUBLIC_API_ENDPOINT } from '$env/static/public';

const client = new GraphQLClient(PUBLIC_API_ENDPOINT);

async function getJWTToken(): Promise<string> {
	const response = await fetch('/api/auth/token');
	if (!response.ok) {
		throw new Error('Failed to get JWT token');
	}
	const data = await response.json();
	return data.token;
}

export async function request(
	document: string,
	variables?: Record<string, any>,
	customHeaders?: HeadersInit
): Promise<any> {
	try {
		const token = await getJWTToken();
		const headers = {
			Authorization: `Bearer ${token}`,
			...customHeaders
		};

		return await client.request(document, variables, headers);
	} catch (error) {
		console.error('GraphQL request error:', error);
		throw error;
	}
}
