import { describe, it, expect } from 'vitest';
import { canEditBoard } from '../listsBoards.svelte';

const board = (members: { user_id: string; role: string }[]) =>
	({ id: 'b', user: { id: 'owner' }, board_members: members }) as never;

describe('canEditBoard', () => {
	it('lets the owner and editors edit', () => {
		expect(canEditBoard(board([]), 'owner')).toBe(true);
		expect(canEditBoard(board([{ user_id: 'e', role: 'editor' }]), 'e')).toBe(true);
		expect(canEditBoard(board([{ user_id: 'o2', role: 'owner' }]), 'o2')).toBe(true);
	});
	it('keeps viewers, strangers and missing data read-only', () => {
		expect(canEditBoard(board([{ user_id: 'v', role: 'viewer' }]), 'v')).toBe(false);
		expect(canEditBoard(board([]), 'x')).toBe(false);
		expect(canEditBoard(null, 'owner')).toBe(false);
		expect(canEditBoard(board([]), undefined)).toBe(false);
	});
});
