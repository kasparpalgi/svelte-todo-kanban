/** @file src/lib/server/runner/index.ts */
// What the Kanban runner can do, as POST /api/runner/<op> (#231). It authenticates with
// RUNNER_API_TOKEN — its own secret, revoked by changing it — instead of the Hasura
// admin secret, which leaves the runner machines.
import crypto from 'crypto';
import { env } from '$env/dynamic/private';
import * as cards from './cards';
import * as extras from './extras';

export const runnerOps = { ...cards, ...extras };
export type RunnerOpName = keyof typeof runnerOps;

const same = (a: string, b: string) => {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** `Authorization: Bearer <RUNNER_API_TOKEN>`; false while the token is unset. */
export function isRunner(request: Request): boolean {
	const token = env.RUNNER_API_TOKEN ?? '';
	const sent = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
	return token.length >= 32 && same(sent, token);
}
