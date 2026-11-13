#!/usr/bin/env node
// Copy the production Postgres (read through Hasura run_sql) into D1 (#232).
//
//   node scripts/d1/copy-from-postgres.mjs [--remote] [--prod] [--check] [--yes] [table …]
//
// Targets todzz-staging unless --prod, the local wrangler state unless --remote. No
// tables = all. A table also brings the tables that reference it, because clearing it
// cascades into them. Re-runnable: it deletes the target rows first, in one SQL file.
// Every row written counts against D1 Free's 100k a day (index rows too, deletes too),
// so a remote run over WRITE_BUDGET stops unless --yes.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { d1, pg, target } from './lib.mjs';
import { literal } from './literal.mjs';

const WRITE_BUDGET = 90_000;
const STATEMENT_BYTES = 90_000; // D1 caps one SQL statement at 100 KB.

// Where D1 differs from Postgres (plan: .claude/todo/226-backend-DONE.md, Sections).
const SOURCES = {
	// settings.tokens.* move to user_secrets, except the browser's own groq key.
	users: {
		cols: {
			settings: `case when settings->'tokens' ? 'groq'
			  then (settings - 'tokens') || jsonb_build_object('tokens', jsonb_build_object('groq', settings->'tokens'->'groq'))
			  else settings - 'tokens' end`
		}
	},
	user_secrets: {
		from: `(select u.id as user_id, t.key as name, t.value, u.updated_at
		          from users u cross join lateral jsonb_each(u.settings->'tokens') t
		         where jsonb_typeof(u.settings->'tokens') = 'object' and t.key <> 'groq') s`,
		types: { user_id: 'uuid', name: 'text', value: 'jsonb', updated_at: 'timestamp with time zone' }
	},
	boards: {
		cols: { github_repo: `case when github ~ '^\\s*\\{' then github::jsonb->>'full_name' end` }
	},
	// One assignee model: todos.assigned_to joins todo_assignees.
	todo_assignees: {
		from: `(select todo_id, user_id, created_at from todo_assignees
		        union all
		        select id, assigned_to, created_at from todos t where assigned_to is not null and not exists
		          (select 1 from todo_assignees a where a.todo_id = t.id and a.user_id = t.assigned_to)) s`,
		types: 'todo_assignees'
	},
	// One timestamp, the event time; the last 30 days.
	logs: { cols: { created_at: '"timestamp"' }, where: `created_at > now() - interval '30 days'` }
};

// Postgres value → the D1 convention: ISO-8601 UTC text, 0/1, JSON as text, REAL.
const CONVERT = {
	'timestamp with time zone': (x) =>
		`to_char(${x} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
	date: (x) => `to_char(${x}, 'YYYY-MM-DD')`,
	boolean: (x) => `${x}::int`,
	jsonb: (x) => `${x}::text`,
	uuid: (x) => `${x}::text`,
	numeric: (x) => `${x}::float8`
};

const args = process.argv.slice(2);
const db = target(args);
const results = (how, value) => d1(db, how, value).map((r) => r.results);
const group = (rows, key, value) =>
	rows.reduce((acc, r) => ((acc[r[key]] ??= []).push(r[value]), acc), {});

// D1's shape, from the applied migrations: columns, index count and foreign keys.
const [colRows, idxRows, fkRows] = results(
	'command',
	`SELECT m.name AS t, p.name AS c FROM sqlite_master m JOIN pragma_table_info(m.name) p
	  WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
	    AND m.name <> 'd1_migrations' ORDER BY m.name, p.cid;
	 SELECT tbl_name AS t, count(*) AS n FROM sqlite_master WHERE type = 'index' GROUP BY tbl_name;
	 SELECT m.name AS child, f."table" AS parent FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f
	  WHERE m.type = 'table' AND m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'`
);
const columns = group(colRows, 't', 'c');
const indexes = Object.fromEntries(idxRows.map((r) => [r.t, r.n]));
const links = fkRows.filter((r) => r.child !== r.parent);
const parents = group(links, 'child', 'parent');
const children = group(links, 'parent', 'child');

// Parents before children.
const order = [];
function visit(t) {
	if (order.includes(t)) return;
	(parents[t] ?? []).forEach(visit);
	order.push(t);
}
Object.keys(columns).sort().forEach(visit);

const asked = args.filter((a) => !a.startsWith('--'));
const picked = new Set(asked.length ? asked : order);
for (const t of picked) {
	if (!columns[t]) throw new Error(`No D1 table "${t}" (apply the migrations first?)`);
	(children[t] ?? []).forEach((c) => picked.add(c));
}
const tables = order.filter((t) => picked.has(t));

const pgTypes = {};
for (const r of await pg(
	`select table_name, column_name, data_type from information_schema.columns where table_schema = 'public'`
))
	(pgTypes[r.table_name] ??= {})[r.column_name] = r.data_type;

async function read(table) {
	const src = SOURCES[table] ?? {};
	const types = typeof src.types === 'object' ? src.types : pgTypes[src.types ?? table];
	if (!types) throw new Error(`${table}: no Postgres source`);
	const used = columns[table].filter((c) => src.cols?.[c] || types[c]);
	const exprs = used.map((c) =>
		(CONVERT[types[c]] ?? ((x) => x))(`(${src.cols?.[c] ?? `"${c}"`})`)
	);
	const [{ rows }] = await pg(
		`select coalesce(json_agg(json_build_array(${exprs.join(', ')})), '[]') as rows
		   from ${src.from ?? `public."${table}"`} ${src.where ? `where ${src.where}` : ''}`
	);
	const defaults = columns[table].filter((c) => !used.includes(c));
	if (defaults.length) console.log(`  ${table}: left to D1 defaults: ${defaults.join(', ')}`);
	return { used, values: JSON.parse(rows) };
}

// One statement per table: D1 caps the terms of a compound SELECT.
const count = () => {
	const counts = results(
		'command',
		tables.map((t) => `SELECT count(*) AS n FROM "${t}"`).join(';')
	);
	return Object.fromEntries(tables.map((t, i) => [t, counts[i][0].n]));
};

console.log(`Reading ${tables.length} tables from Postgres…`);
const data = {};
for (const t of tables) data[t] = await read(t);
const before = count();

/** One SQL file: clear children first, insert parents first, ≤ STATEMENT_BYTES a statement. */
function copySql() {
	const sql = ['PRAGMA defer_foreign_keys = true;'];
	for (const t of [...tables].reverse()) sql.push(`DELETE FROM "${t}";`);
	for (const t of tables) {
		const head = `INSERT INTO "${t}" (${data[t].used.map((c) => `"${c}"`).join(', ')}) VALUES\n`;
		let batch = [];
		let bytes = 0;
		for (const row of data[t].values) {
			const tuple = `(${row.map(literal).join(', ')})`;
			if (batch.length && bytes + Buffer.byteLength(tuple) > STATEMENT_BYTES) {
				sql.push(head + batch.join(',\n') + ';');
				batch = [];
				bytes = 0;
			}
			batch.push(tuple);
			bytes += Buffer.byteLength(tuple);
		}
		if (batch.length) sql.push(head + batch.join(',\n') + ';');
	}
	return sql.join('\n') + '\n';
}

function importAll() {
	const writes = tables.reduce(
		(n, t) => n + (before[t] + data[t].values.length) * (1 + (indexes[t] ?? 0)),
		0
	);
	console.log(
		`Target ${db.name} (${db.remote ? 'remote' : 'local'}): ~${writes} rows written (deletes + inserts + index rows)`
	);
	if (db.remote && writes > WRITE_BUDGET && !args.includes('--yes')) {
		console.error(
			`Over the ${WRITE_BUDGET} budget (D1 Free: 100k a day). Re-run with --yes, or tomorrow.`
		);
		process.exit(1);
	}
	const dir = mkdtempSync(join(tmpdir(), 'todzz-d1-'));
	const file = join(dir, 'copy.sql');
	try {
		writeFileSync(file, copySql());
		const started = Date.now();
		const { meta } = d1(db, 'file', file).at(-1);
		const secs = ((Date.now() - started) / 1000).toFixed(1);
		console.log(
			`Imported in ${secs} s: ${meta?.rows_written ?? '?'} rows written, ${meta?.rows_read ?? '?'} read`
		);
	} finally {
		rmSync(dir, { recursive: true, force: true }); // holds password hashes and tokens
	}
}

// --check compares row counts only and writes nothing.
const check = args.includes('--check');
if (!check) importAll();
const after = check ? before : count();
const rows = tables.map((t) => ({ table: t, postgres: data[t].values.length, d1: after[t] }));
console.table(rows);
const bad = rows.filter((r) => r.postgres !== r.d1);
if (bad.length) {
	console.error(`Row counts differ: ${bad.map((r) => r.table).join(', ')}`);
	process.exit(1);
}
console.log(`All ${rows.length} tables match.`);
