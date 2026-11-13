// Helpers for the D1 scripts (#232): read Postgres through Hasura, run SQL on D1 with wrangler.
import { execFileSync } from 'node:child_process';
import 'dotenv/config';

const env = (name) => (process.env[name] ?? '').replace(/[\r"']/g, '').trim();

// wrangler reads CLOUDFLARE_*; this repo's .env spells them CLOUDFARE_*.
process.env.CLOUDFLARE_API_TOKEN ||= env('CLOUDFARE_API_TOKEN');
process.env.CLOUDFLARE_ACCOUNT_ID ||= env('CLOUDFARE_ACCOUNT_ID');

/** Rows of a read-only SQL query on the production Postgres (Hasura `run_sql`). */
export async function pg(sql) {
	const base = env('API_ENDPOINT').replace(/\/v1\/graphql$/, '');
	const res = await fetch(`${base}/v2/query`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-hasura-admin-secret': env('HASURA_ADMIN_SECRET')
		},
		body: JSON.stringify({ type: 'run_sql', args: { source: 'default', sql, read_only: true } })
	});
	const body = await res.json();
	if (!res.ok) throw new Error(`run_sql failed: ${JSON.stringify(body)}`);
	const [head, ...rows] = body.result ?? [];
	return rows.map((row) => Object.fromEntries(head.map((name, i) => [name, row[i]])));
}

/**
 * `--prod` targets `todzz`, otherwise `todzz-staging` (wrangler env `staging`).
 * `--remote` runs on Cloudflare, otherwise on the local wrangler state (.wrangler/).
 */
export function target(args) {
	const prod = args.includes('--prod');
	return {
		name: prod ? 'todzz' : 'todzz-staging',
		remote: args.includes('--remote'),
		flags: [
			prod ? 'todzz' : 'todzz-staging',
			...(prod ? [] : ['--env', 'staging']),
			args.includes('--remote') ? '--remote' : '--local'
		]
	};
}

/** Runs `--command <sql>` or `--file <path>` on D1; returns wrangler's JSON (one entry per statement). */
export function d1(db, how, value) {
	const out = execFileSync(
		'npx',
		['wrangler', 'd1', 'execute', ...db.flags, `--${how}`, value, '--json', '--yes'],
		{ encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] }
	);
	// A remote --file import prints its progress lines before the JSON.
	return JSON.parse(out.startsWith('[') ? out : out.slice(out.indexOf('\n[') + 1));
}
