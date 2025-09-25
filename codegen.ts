/** @file codegen.ts */
import type { CodegenConfig } from '@graphql-codegen/cli';
import dotenv from 'dotenv';

dotenv.config();

const environment = process.env;
const apiEndpoint =
	environment.PUBLIC_API_ENV === 'production'
		? environment.API_ENDPOINT
		: environment.API_ENDPOINT_DEV;

if (!apiEndpoint) {
	throw new Error('API endpoint not found. Check your environment variables.');
}

if (!environment.HASURA_ADMIN_SECRET) {
	throw new Error('HASURA_ADMIN_SECRET not found. Check your environment variables.');
}

const config: CodegenConfig = {
	schema: [
		{
			[apiEndpoint]: {
				headers: {
					'x-hasura-admin-secret': environment.HASURA_ADMIN_SECRET || ''
				}
			}
		}
	],
	documents: ['src/lib/graphql/documents.ts'],
	generates: {
		'src/lib/graphql/generated/': {
			preset: 'client',
			plugins: [],
			presetConfig: {
				fragmentMasking: false,
				gqlTagName: 'graphql'
			},
			config: {
				strictScalars: true,
				scalars: {
					uuid: 'string',
					timestamptz: 'string',
					date: 'string',
					bigint: 'number',
					numeric: 'number',
					json: 'any',
					jsonb: 'any'
				},
				documentMode: 'string'
			}
		}
	},
	hooks: {
		afterAllFileWrite: ['echo "Files generated, running fix script..."', 'node fix-imports.cjs']
	}
};

export default config;
