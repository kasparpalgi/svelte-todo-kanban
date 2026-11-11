/** @file src/lib/server/admin.ts */
import { env } from '$env/dynamic/private';

export function isAdminEmail(email: string | null | undefined): boolean {
	if (!email) return false;
	const admins = env.ADMIN_EMAILS.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
	return admins.includes(email.toLowerCase());
}
