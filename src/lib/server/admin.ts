/** @file src/lib/server/admin.ts */
import { ADMIN_EMAILS } from '$env/static/private';

export function isAdminEmail(email: string | null | undefined): boolean {
	if (!email) return false;
	const admins = ADMIN_EMAILS.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
	return admins.includes(email.toLowerCase());
}
