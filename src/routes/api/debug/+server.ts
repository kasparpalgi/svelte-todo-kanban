import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { PUBLIC_APP_URL, PUBLIC_APP_ENV } from '$env/static/public';

export async function GET({ url }) {
	return json({
		PUBLIC_APP_URL,
		PUBLIC_APP_ENV,
		AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID?.substring(0, 20) + '...',
		AUTH_GOOGLE_SECRET_EXISTS: !!env.AUTH_GOOGLE_SECRET,
		AUTH_SECRET_EXISTS: !!env.AUTH_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		ORIGIN: process.env.ORIGIN,
		HOST_HEADER: process.env.HOST_HEADER,
		PROTOCOL_HEADER: process.env.PROTOCOL_HEADER,
		request_url: url.toString(),
		request_host: url.host,
		request_protocol: url.protocol
	});
}
