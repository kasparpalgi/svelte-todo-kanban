/** @file src/lib/server/ops/rows.ts */
// Small helpers for ops on rows owned by one user (owned.ts, money.ts).
import { z } from 'zod';
import { OpError } from './op';

export const text = (max: number) => z.string().max(max).nullable().optional();
export const byId = z.object({ id: z.guid() });
export const deleted = (rows: { affected_rows: number } | null | undefined) => {
	if (!rows?.affected_rows) throw new OpError(404, 'Not found');
	return { deleted: true };
};
export function updated<T>(rows: { returning: T[] } | null | undefined): T {
	const row = rows?.returning[0];
	if (!row) throw new OpError(404, 'Not found');
	return row;
}
