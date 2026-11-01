/** @file src/lib/utils/__tests__/agentMachine.test.ts */
import { describe, it, expect } from 'vitest';
import { AGENT_MACHINES, pinnedMachine, withPin } from '../agentMachine';
import { todoEditSchema } from '../cardHelpers';
import { buildTaskFile } from '$lib/server/taskfile';

const KAREL = 'karelsaega1992@gmail.com';

describe('agent machines', () => {
	it('offers the Windows runner alongside the others', () => {
		expect(AGENT_MACHINES).toEqual(['mac', 'karel', 'dell', 'windows']);
	});

	it('lets a card be saved with the Windows machine', () => {
		const parsed = todoEditSchema.safeParse({
			title: 'x',
			priority: null,
			agent_machine: 'windows'
		});
		expect(parsed.success).toBe(true);
	});

	it('still refuses a machine no runner answers to', () => {
		const parsed = todoEditSchema.safeParse({ title: 'x', priority: null, agent_machine: 'pi' });
		expect(parsed.success).toBe(false);
	});
});

describe('pinnedMachine', () => {
	it('pins Karel to the Windows PC, whatever the casing', () => {
		expect(pinnedMachine(KAREL)).toBe('windows');
		expect(pinnedMachine(' KarelSaega1992@Gmail.com ')).toBe('windows');
	});

	it('leaves everyone else free to pick', () => {
		expect(pinnedMachine('kaspar@e-stonia.co.uk')).toBeNull();
		expect(pinnedMachine(null)).toBeNull();
		expect(pinnedMachine(undefined)).toBeNull();
	});
});

describe('withPin', () => {
	const card = { id: 'abc', title: 'Ship it', content: 'do it', agent_machine: null };

	it('addresses an Auto card Karel publishes to Windows', () => {
		expect(buildTaskFile(withPin(card, KAREL))).toContain('> Machine: windows');
	});

	it('overrides a machine someone else picked on his card', () => {
		expect(withPin({ ...card, agent_machine: 'mac' }, KAREL).agent_machine).toBe('windows');
	});

	it('leaves other people’s cards alone, and copes with a missing card', () => {
		expect(withPin(card, 'kaspar@e-stonia.co.uk')).toBe(card);
		expect(withPin(null as unknown as typeof card, KAREL)).toBeNull();
	});
});
