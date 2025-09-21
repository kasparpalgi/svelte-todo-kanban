/** @file codegen.ts */
import type { CodegenConfig } from '@graphql-codegen/cli';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

const config: CodegenConfig = {
	schema: [
		{
			[env.API_ENDPOINT || 'http://localhost:3001/v1/graphql']: {
				headers: {
					'x-hasura-admin-secret': env.HASURA_ADMIN_SECRET || ''
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
		afterAllFileWrite: [
			// Fix the import in graphql.ts
			'sed -i "s|from \\\"@graphql-typed-document-node/core\\\"|from \\\"./fragment-masking\\\"|g" src/lib/graphql/generated/graphql.ts || echo "sed command failed, you may need to manually fix the import"'
		]
	}
};

export default config;
