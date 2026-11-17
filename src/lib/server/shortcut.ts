/** @file src/lib/server/shortcut.ts */
// `/<alias>` URL shortcuts: the target, counting the visit. A failed count never blocks
// the redirect.
import { eq, sql } from 'drizzle-orm';
import { GET_URL_SHORTCUT_BY_ALIAS, INCREMENT_URL_SHORTCUT_VISITS } from '$lib/graphql/documents';
import { serverRequest } from '$lib/graphql/server-client';
import { url_shortcuts } from '$lib/server/db/schema';
import type { Ctx } from '$lib/server/ops/op';

async function count(visit: () => Promise<unknown>, alias: string) {
	try {
		await visit();
	} catch (err: any) {
		console.warn('[shortcut] visit increment failed', { alias, message: err?.message });
	}
}

/** The shortcut's target URL, or null when there is no such alias. */
export async function followShortcut(ctx: Ctx, alias: string): Promise<string | null> {
	if (ctx.d1) {
		const d1 = ctx.d1;
		const [hit] = await d1
			.select({ target_url: url_shortcuts.target_url })
			.from(url_shortcuts)
			.where(eq(url_shortcuts.alias, alias));
		if (!hit) return null;
		await count(
			() =>
				d1
					.update(url_shortcuts)
					.set({ visit_count: sql`${url_shortcuts.visit_count} + 1` })
					.where(eq(url_shortcuts.alias, alias)),
			alias
		);
		return hit.target_url;
	}
	const data = await serverRequest(GET_URL_SHORTCUT_BY_ALIAS, { alias });
	const hit = data.url_shortcuts?.[0];
	if (!hit?.target_url) return null;
	await count(() => serverRequest(INCREMENT_URL_SHORTCUT_VISITS, { alias: hit.alias }), alias);
	return hit.target_url;
}
