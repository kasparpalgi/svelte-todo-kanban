import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { PUBLIC_APP_URL } from '$env/static/public';

export async function GET() {
	return json({
		PUBLIC_APP_URL,
		AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID?.substring(0, 20) + '...',
		AUTH_SECRET_EXISTS: !!env.AUTH_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		ORIGIN: process.env.ORIGIN,
		HOST_HEADER: process.env.HOST_HEADER,
		PROTOCOL_HEADER: process.env.PROTOCOL_HEADER
	});
}