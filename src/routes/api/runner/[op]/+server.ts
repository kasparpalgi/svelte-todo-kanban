/** @file src/routes/api/runner/[op]/+server.ts */
// The Kanban runner's API: POST /api/runner/<op> with `Authorization: Bearer
// <RUNNER_API_TOKEN>` and a JSON body. Answers `{ data }` or `{ error }` (#231). With
// DATA_BACKEND=d1 each op runs its D1 version from $lib/server/runner/d1 (#247).
import { json } from '@sveltejs/kit';
import { serverLog } from '$lib/server/log';
import { OpError, type Op } from '$lib/server/ops/op';
import { opCtx } from '$lib/server/ops/run';
import { isRunner, runnerOps, type RunnerOpName } from '$lib/server/runner';
import type { RequestHandler } from './$types';

const fail = (status: number, error: string) => json({ error }, { status });

export const POST: RequestHandler = async ({ params, request, platform }) => {
	if (!isRunner(request)) return fail(401, 'Not authorized');
	if (!Object.hasOwn(runnerOps, params.op)) return fail(404, `Unknown op: ${params.op}`);
	const name = params.op as RunnerOpName;
	const op = runnerOps[name] as Op;

	const input = op.input.safeParse(await request.json().catch(() => ({})));
	if (!input.success) {
		const issue = input.error.issues[0];
		return fail(400, `Invalid input${issue ? `: ${issue.path.join('.')} ${issue.message}` : ''}`);
	}

	try {
		const ctx = opCtx(null, platform);
		if (!ctx.d1) return json({ data: await op.run(ctx, input.data) });
		const run = (await import('$lib/server/runner/d1')).runnerD1[name] as Op['run'];
		return json({ data: await run(ctx, input.data) });
	} catch (error) {
		if (error instanceof OpError) return fail(error.status, error.message);
		serverLog.error('api/runner', `${params.op} failed`, String(error));
		return fail(500, `${params.op} failed`);
	}
};
