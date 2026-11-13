/** @file src/routes/api/runner/[op]/+server.ts */
// The Kanban runner's API: POST /api/runner/<op> with `Authorization: Bearer
// <RUNNER_API_TOKEN>` and a JSON body. Answers `{ data }` or `{ error }` (#231).
import { json } from '@sveltejs/kit';
import { serverLog } from '$lib/server/log';
import { OpError, type Op } from '$lib/server/ops/op';
import { opCtx } from '$lib/server/ops/run';
import { isRunner, runnerOps } from '$lib/server/runner';
import type { RequestHandler } from './$types';

const fail = (status: number, error: string) => json({ error }, { status });

export const POST: RequestHandler = async ({ params, request, platform }) => {
	if (!isRunner(request)) return fail(401, 'Not authorized');
	if (!Object.hasOwn(runnerOps, params.op)) return fail(404, `Unknown op: ${params.op}`);
	const op = runnerOps[params.op as keyof typeof runnerOps] as Op;

	const input = op.input.safeParse(await request.json().catch(() => ({})));
	if (!input.success) {
		const issue = input.error.issues[0];
		return fail(400, `Invalid input${issue ? `: ${issue.path.join('.')} ${issue.message}` : ''}`);
	}

	try {
		return json({ data: await op.run(opCtx(null, platform), input.data) });
	} catch (error) {
		if (error instanceof OpError) return fail(error.status, error.message);
		serverLog.error('api/runner', `${params.op} failed`, String(error));
		return fail(500, `${params.op} failed`);
	}
};
