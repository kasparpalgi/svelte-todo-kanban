/** @file src/lib/server/ops/d1/boardRows.ts */
// Boards in the shape of Hasura's BoardFields fragment, read with one statement.
import { sql, type SQL } from 'drizzle-orm';
import type { D1 } from '$lib/server/db';
import { boards } from '$lib/server/db/schema';

const userFields = { id: true, name: true, username: true, email: true, image: true } as const;

const withFields = {
	labels: {
		columns: {
			id: true,
			name: true,
			color: true,
			sort_order: true,
			board_id: true,
			created_at: true,
			updated_at: true
		}
	},
	user: {
		columns: {
			id: true,
			username: true,
			email: true,
			claude_plan: true,
			claude_plan_monthly: true,
			claude_plan_currency: true
		}
	},
	board_members: { with: { user: { columns: userFields } } },
	client: {
		columns: {
			id: true,
			name: true,
			company_name: true,
			email: true,
			currency: true,
			default_rate: true
		}
	}
} as const;

/** `boards.github` as the client reads it: JSON text built from `github_repo`. */
export function githubJson(repo: string | null) {
	if (!repo) return null;
	const [owner, ...rest] = repo.split('/');
	return JSON.stringify({ owner, repo: rest.join('/'), full_name: repo });
}

/** `github_repo` from the JSON text the client writes. */
export function githubRepo(github: string | null): string | null {
	if (!github) return null;
	const { owner, repo, full_name } = JSON.parse(github) as Record<string, string | undefined>;
	return full_name || (owner && repo ? `${owner}/${repo}` : null);
}

type Order = 'switcher' | 'name';

/** PG sorted names by en_US collation (case-insensitive); NOCASE is SQLite's closest. */
const orderBy = (order: Order): SQL[] =>
	order === 'name'
		? [sql`${boards.name} collate nocase`]
		: [sql`${boards.sort_order}`, sql`${boards.name} collate nocase`];

export async function boardRows(d1: D1, where: SQL | undefined, order: Order = 'switcher') {
	const rows = await d1.query.boards.findMany({
		where,
		orderBy: orderBy(order),
		columns: {
			id: true,
			name: true,
			alias: true,
			sort_order: true,
			github_repo: true,
			is_public: true,
			allow_public_comments: true,
			settings: true,
			archived_at: true,
			client_id: true,
			created_at: true,
			updated_at: true
		},
		with: withFields
	});
	return rows.map(({ github_repo, ...board }) => ({
		...board,
		github: githubJson(github_repo),
		// `user` is never missing: boards.user_id is NOT NULL with a foreign key.
		user: board.user!
	}));
}
