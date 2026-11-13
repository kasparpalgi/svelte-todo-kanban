/** @file src/routes/api/data/[op]/+server.ts */
// The browser's data API: POST /api/data/<op> with the session cookie and a JSON
// body. Replaces direct browser → Hasura GraphQL, one op at a time (#226).
import { json } from '@sveltejs/kit';
import { serverRequest } from '$lib/graphql/server-client';
import { serverLog } from '$lib/server/log';
import { ops } from '$lib/server/ops';
import { OpError, type Op } from '$lib/server/ops/op';
import type { RequestHandler } from './$types';

const fail = (status: number, error: string) => json({ error }, { status });

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!Object.hasOwn(ops, params.op)) return fail(404, `Unknown op: ${params.op}`);
	const op = ops[params.op as keyof typeof ops] as Op;

	const userId = (await locals.auth())?.user?.id ?? null;
	if (op.auth === 'user' && !userId) return fail(401, 'Authentication required');

	const body = await request.json().catch(() => undefined);
	const input = op.input.safeParse(body);
	if (!input.success) {
		const issue = input.error.issues[0];
		return fail(400, `Invalid input${issue ? `: ${issue.path.join('.')} ${issue.message}` : ''}`);
	}

	try {
		const data = await op.run({ userId, db: serverRequest }, input.data);
		return json({ data });
	} catch (error) {
		if (error instanceof OpError) return fail(error.status, error.message);
		serverLog.error('api/data', `${params.op} failed`, String(error));
		return fail(500, `${params.op} failed`);
	}
};
