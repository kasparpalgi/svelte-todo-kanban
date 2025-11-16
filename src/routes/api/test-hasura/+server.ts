import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';

export async function GET() {
	const apiEndpoint = PUBLIC_API_ENV === 'production' ? env.API_ENDPOINT : env.API_ENDPOINT_DEV;
	
	try {
		const client = new GraphQLClient(apiEndpoint!, {
			headers: {
				'x-hasura-admin-secret': env.HASURA_ADMIN_SECRET!
			}
		});

		const query = `
			query {
				users(limit: 1) {
					id
					email
				}
			}
		`;

		const result = await client.request(query);

		return json({
			success: true,
			endpoint: apiEndpoint,
			hasAdminSecret: !!env.HASURA_ADMIN_SECRET,
			adminSecretLength: env.HASURA_ADMIN_SECRET?.length,
			result
		});
	} catch (error: any) {
		return json({
			success: false,
			endpoint: apiEndpoint,
			hasAdminSecret: !!env.HASURA_ADMIN_SECRET,
			adminSecretLength: env.HASURA_ADMIN_SECRET?.length,
			error: error.message,
			response: error.response
		}, { status: 500 });
	}
}