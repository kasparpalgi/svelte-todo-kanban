/** @file src/lib/graphql/client.ts */
import { PUBLIC_API_ENDPOINT } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

const client = new GraphQLClient(PUBLIC_API_ENDPOINT);

async function getJWTToken(): Promise<string> {
	const response = await fetch('/api/auth/token');
	if (!response.ok) {
		throw new Error('Failed to get JWT token');
	}
	const data = await response.json();
	return data.token;
}

export async function request<TResult, TVariables extends object | undefined = undefined>(
	document: TypedDocumentNode<TResult, TVariables>,
	variables?: TVariables,
	customHeaders?: HeadersInit
): Promise<TResult> {
	try {
		const token = await getJWTToken();
		const headers = {
			Authorization: `Bearer ${token}`,
			...customHeaders
		};

		return await client.request(document, variables as any, headers);
	} catch (error) {
		console.error('GraphQL request error:', error);
		throw error;
	}
}
