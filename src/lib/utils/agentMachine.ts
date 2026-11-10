/** @file src/lib/utils/agentMachine.ts */

/**
 * The machines a runner answers to, in dropdown order; see `> Machine:` in the task file.
 * `windows` is the WSL runner on the Windows PC (karel2). `cloud` is no computer: the
 * runner with `cloud` on sends the task to a Claude Code cloud session, and it comes back
 * as a pull request (svelte-hasura-boilerplate#86).
 */
export const AGENT_MACHINES = ['mac', 'karel', 'dell', 'windows', 'cloud'] as const;

export type AgentMachine = (typeof AGENT_MACHINES)[number];

/**
 * People whose cards run on one computer only. Their dropdown offers that machine and
 * nothing else — not even Auto, which any runner may claim — and the server writes it
 * into every task file they publish, so a card they never opened still lands there.
 */
const PINNED: Record<string, AgentMachine> = {
	'karelsaega1992@gmail.com': 'windows'
};

export const pinnedMachine = (email?: string | null): AgentMachine | null =>
	PINNED[(email ?? '').trim().toLowerCase()] ?? null;

/** The card as `email` publishes it: a pinned user's machine wins over whatever it names. */
export function withPin<T extends { agent_machine?: string | null }>(
	card: T,
	email?: string | null
): T {
	const machine = pinnedMachine(email);
	return card && machine ? { ...card, agent_machine: machine } : card;
}
