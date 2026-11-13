/** @file src/lib/server/ops/d1/__contract__/compare.ts */
// What "the same JSON" means between Hasura and D1 (#233): no `__typename`; timestamps
// as instants to the millisecond (Hasura sends `.123456+00:00`, D1 `.123Z`); and the
// nested lists the GraphQL documents leave unordered compared as sets (sorted by id).
const TIME = /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)/g;

/** Relations queried without `order_by`: Postgres returns them in any order. */
const UNORDERED = new Set(['labels', 'board_members']);

const instant = (time: string) => new Date(time.replace(/(\.\d{3})\d+/, '$1')).toISOString();

const byId = (a: unknown, b: unknown) =>
	String((a as { id?: unknown }).id) < String((b as { id?: unknown }).id) ? -1 : 1;

export function normalize(value: unknown, key = ''): unknown {
	if (Array.isArray(value)) {
		const items = value.map((v) => normalize(v));
		return UNORDERED.has(key) ? items.sort(byId) : items;
	}
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([k]) => k !== '__typename')
				.sort(([a], [b]) => (a < b ? -1 : 1))
				.map(([k, v]) => [k, normalize(v, k)])
		);
	}
	if (typeof value === 'string') return value.replace(TIME, instant);
	return value;
}

/** The first path where two normalized values differ, with both values; null when equal. */
export function firstDiff(a: unknown, b: unknown, path = '$'): string | null {
	if (a === b) return null;
	const show = (v: unknown) => JSON.stringify(v)?.slice(0, 160);
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
		return `${path}: hasura ${show(a)} ≠ d1 ${show(b)}`;
	}
	if (Array.isArray(a) !== Array.isArray(b)) return `${path}: hasura ${show(a)} ≠ d1 ${show(b)}`;
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	if (Array.isArray(a) && a.length !== (b as unknown[]).length) {
		return `${path}: ${a.length} items ≠ ${(b as unknown[]).length}`;
	}
	for (const key of keys) {
		const diff = firstDiff(
			(a as Record<string, unknown>)[key],
			(b as Record<string, unknown>)[key],
			`${path}.${key}`
		);
		if (diff) return diff;
	}
	return null;
}
