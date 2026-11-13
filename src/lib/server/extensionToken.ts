/** @file src/lib/server/extensionToken.ts */
// The Chrome extension has no session cookie: it sends the 24-hour token that
// /extension-auth got from /api/auth/token, signed with AUTH_SECRET (#231). It opens
// only the three ops the extension uses, so a leaked token cannot reach the rest.
import { jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

export const EXTENSION_OPS: ReadonlySet<string> = new Set(['getBoards', 'getNotes', 'createNote']);

/** The user id an extension token on this request stands for, else null. */
export async function extensionUserId(request: Request, op: string): Promise<string | null> {
	const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
	if (!token || !EXTENSION_OPS.has(op) || !env.AUTH_SECRET) return null;
	try {
		const key = new TextEncoder().encode(env.AUTH_SECRET);
		const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
		return typeof payload.sub === 'string' ? payload.sub : null;
	} catch {
		return null;
	}
}
