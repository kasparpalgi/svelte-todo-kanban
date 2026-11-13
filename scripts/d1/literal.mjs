// A JSON value from Postgres as a SQLite literal (#232). No side effects, so tests import it.
/** @param {unknown} value */
export function literal(value) {
	if (value === null || value === undefined) return 'NULL';
	if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
	if (typeof value === 'boolean') return value ? '1' : '0';
	return `'${String(value).replaceAll("'", "''")}'`;
}
