/** @file src/hooks.server.ts (updated with better typing) */
import { SvelteKitAuth } from '@auth/sveltekit';
import { HasuraAdapter } from '@auth/hasura-adapter';
import Google from '@auth/sveltekit/providers/google';
import Nodemailer from '@auth/sveltekit/providers/nodemailer';
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
	HASURA_ADMIN_SECRET
} from '$env/static/private';

export const { handle } = SvelteKitAuth({
	adapter: HasuraAdapter({
		endpoint: API_ENDPOINT,
		adminSecret: HASURA_ADMIN_SECRET
	}),
	providers: [
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
	],
	session: {
		strategy: 'jwt',
		maxAge: 3 * 24 * 60 * 60 // 3 days
	},
	callbacks: {
		jwt: async ({ token, user, account }) => {
			console.log('JWT callback - token:', token, 'user:', user, 'account:', account);

			if (account && user) {
				token.userId = user.id;
				token.hasuraRole = 'user'; // default role
			}

			console.log('JWT callback returning token:', token);
			return token;
		},
		session: async ({ session, token }) => {
			console.log('Session callback - session:', session, 'token:', token);

			if (token && token.userId) {
				session.user.id = token.userId as string;
				session.hasuraRole = token.hasuraRole as string;
			}

			console.log('Session callback returning session:', session);
			return session;
		}
	},
	secret: AUTH_SECRET,
	trustHost: true
});
