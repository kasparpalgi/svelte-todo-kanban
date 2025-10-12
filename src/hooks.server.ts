/** @file src/hooks.server.ts */
import {
	AUTH_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	EMAIL_SERVER_HOST,
	EMAIL_SERVER_PORT,
	EMAIL_SERVER_USER,
	EMAIL_SERVER_PASSWORD,
	EMAIL_FROM,
	API_ENDPOINT,
	API_ENDPOINT_DEV,
	HASURA_ADMIN_SECRET
} from '$env/static/private';
import { PUBLIC_APP_ENV, PUBLIC_API_ENV } from '$env/static/public';
import { SvelteKitAuth } from '@auth/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { HasuraAdapter } from '@auth/hasura-adapter';
import Google from '@auth/sveltekit/providers/google';
import Nodemailer from '@auth/sveltekit/providers/nodemailer';
import Credentials from '@auth/sveltekit/providers/credentials';
import type { Provider } from '@auth/sveltekit/providers';
import type { Handle } from '@sveltejs/kit';

const maxAge = PUBLIC_APP_ENV ? 90 * 24 * 60 * 60 : 3 * 24 * 60 * 60; // 90 days vs 3 days
const apiEndpoint = PUBLIC_API_ENV === 'production' ? API_ENDPOINT : API_ENDPOINT_DEV;

const providers: Provider[] = [
	Google({
		clientId: AUTH_GOOGLE_ID,
		clientSecret: AUTH_GOOGLE_SECRET
	}),
	Nodemailer({
		server: {
			host: EMAIL_SERVER_HOST,
			port: Number(EMAIL_SERVER_PORT),
			auth: {
				user: EMAIL_SERVER_USER,
				pass: EMAIL_SERVER_PASSWORD
			}
		},
		from: EMAIL_FROM
	})
];

if (PUBLIC_APP_ENV !== 'production') {
	providers.push(
		Credentials({
			id: '166ca52b-4ecf-4d30-842f-95f97656aeb5',
			name: 'Test Login',
			credentials: {
				email: { label: 'Email', type: 'email' }
			},
			async authorize(credentials) {
				if (credentials.email === 'test@test.com') {
					return {
						id: '166ca52b-4ecf-4d30-842f-95f97656aeb5',
						name: 'Test User',
						email: 'test@test.com'
					};
				}
				return null;
			}
		})
	);
}

export const { handle: authHandle, signOut } = SvelteKitAuth({
	adapter: HasuraAdapter({
		endpoint: apiEndpoint,
		adminSecret: HASURA_ADMIN_SECRET
	}),
	providers,
	session: {
		strategy: 'jwt',
		maxAge: maxAge
	},
	callbacks: {
		jwt: async ({ token, user, account }) => {
			if (account && user) {
				token.userId = user.id;
				token.hasuraRole = 'user';
			}
			return token;
		},
		session: async ({ session, token }) => {
			if (token && token.userId) {
				session.user.id = token.userId as string;
				session.hasuraRole = token.hasuraRole as string;
			}
			return session;
		}
	},
	secret: AUTH_SECRET,
	trustHost: true
});

const securityHandle: Handle = async ({ event, resolve }) => {
	const url = event.url;
	const session = await event.locals.auth();
	const isBoardRoute = url.pathname.match(/^\/[^/]+\/[^/]+\/[^/]+/);

	console.log('Google OAuth redirect URL:', `${event.url.origin}/api/auth/callback/google`);

	if (
		!session &&
		isBoardRoute &&
		!url.pathname.includes('/signin') &&
		!url.pathname.includes('/api')
	) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/signin' }
		});
	}

	const response = await resolve(event);

	if (
		!url.pathname.includes('/api') &&
		!url.pathname.match(/\.(css|js|svg|png|jpg|jpeg|gif|woff|woff2)$/)
	) {
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	}

	return response;
};

export const handle = sequence(authHandle, securityHandle);
