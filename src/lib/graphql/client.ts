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

// Accept any document that has toString method
export async function request<TResult, TVariables = any>(
	document: { toString(): string },
	variables?: TVariables,
	customHeaders?: HeadersInit
): Promise<TResult> {
	try {
		const token = await getJWTToken();
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

export async function adminRequest<TResult, TVariables = any>(
	document: { toString(): string },
	variables?: TVariables,
	customHeaders?: HeadersInit
): Promise<TResult> {
	if (typeof window !== 'undefined') {
		throw new Error('adminRequest should only be used server-side');
	}

	const { HASURA_ADMIN_SECRET, API_ENDPOINT } = process.env;

	if (!HASURA_ADMIN_SECRET || !API_ENDPOINT) {
		throw new Error('Missing required environment variables for admin request');
	}

	const adminClient = new GraphQLClient(API_ENDPOINT);

	try {
		const headers = {
			'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
			...customHeaders
		};

		const query = document.toString();

		return await adminClient.request(query, variables as any, headers);
	} catch (error) {
		console.error('GraphQL admin request error:', error);
		throw error;
	}
}
