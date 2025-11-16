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
import { hashPassword, verifyPassword } from '$lib/server/password';
import { GraphQLClient } from 'graphql-request';

// Extend the Session and JWT types to include custom properties
declare module '@auth/core/types' {
	interface Session {
		hasuraRole?: string;
		accessToken?: string;
		error?: string;
	}

	interface JWT {
		userId?: string;
		hasuraRole?: string;
		accessToken?: string;
		refreshToken?: string;
		expires_at?: number;
		error?: string;
	}
}

const maxAge = PUBLIC_APP_ENV ? 90 * 24 * 60 * 60 : 3 * 24 * 60 * 60; // 90 days vs 3 days
const apiEndpoint = PUBLIC_API_ENV === 'production' ? API_ENDPOINT : API_ENDPOINT_DEV;

const providers: Provider[] = [
	Google({
		clientId: AUTH_GOOGLE_ID,
		clientSecret: AUTH_GOOGLE_SECRET,
		authorization: {
			params: {
				scope:
					'openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
				access_type: 'offline',
				prompt: 'consent'
			}
		}
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

// Email/Password Credentials provider
providers.push(
	Credentials({
		id: 'credentials',
		name: 'Email and Password',
		credentials: {
			email: { label: 'Email', type: 'email' },
			password: { label: 'Password', type: 'password' },
			mode: { label: 'Mode', type: 'text' }, // 'login' or 'signup'
			name: { label: 'Name', type: 'text' } // Only for signup
		},
		async authorize(credentials) {
			try {
				const { email, password, mode, name } = credentials as {
					email: string;
					password: string;
					mode?: string;
					name?: string;
				};

				if (!email || !password) {
					throw new Error('Email and password are required');
				}

				// Create GraphQL client with admin secret
				const client = new GraphQLClient(apiEndpoint, {
					headers: {
						'x-hasura-admin-secret': HASURA_ADMIN_SECRET
					}
				});

				if (mode === 'signup') {
					// Sign up mode: Create new user
					if (!name) {
						throw new Error('Name is required for signup');
					}

					// Check if user already exists
					const existingUserQuery = `
						query GetUser($email: String!) {
							users(where: { email: { _eq: $email } }, limit: 1) {
								id
							}
						}
					`;
					const existingUserData = await client.request<any>(existingUserQuery, { email });

					if (existingUserData.users && existingUserData.users.length > 0) {
						throw new Error('User with this email already exists');
					}

					// Hash password
					const hashedPassword = await hashPassword(password);

					// Create user
					const createUserMutation = `
						mutation CreateUser($email: String!, $name: String!, $password: String!) {
							insert_users_one(object: {
								email: $email,
								name: $name,
								password: $password,
								emailVerified: null
							}) {
								id
								name
								email
								username
								image
							}
						}
					`;

					const userData = await client.request<any>(createUserMutation, {
						email,
						name,
						password: hashedPassword
					});

					if (!userData.insert_users_one) {
						throw new Error('Failed to create user');
					}

					return {
						id: userData.insert_users_one.id,
						name: userData.insert_users_one.name,
						email: userData.insert_users_one.email,
						username: userData.insert_users_one.username,
						image: userData.insert_users_one.image
					};
				} else {
					// Login mode: Verify credentials
					const userQuery = `
						query GetUserWithPassword($email: String!) {
							users(where: { email: { _eq: $email } }, limit: 1) {
								id
								name
								email
								username
								image
								password
							}
						}
					`;

					const userData = await client.request<any>(userQuery, { email });

					if (!userData.users || userData.users.length === 0) {
						throw new Error('Invalid email or password');
					}

					const user = userData.users[0];

					if (!user.password) {
						throw new Error(
							'This account was created with a different login method. Please use the appropriate sign-in option.'
						);
					}

					// Verify password
					const isValid = await verifyPassword(password, user.password);

					if (!isValid) {
						throw new Error('Invalid email or password');
					}

					return {
						id: user.id,
						name: user.name,
						email: user.email,
						username: user.username,
						image: user.image
					};
				}
			} catch (error) {
				console.error('Auth error:', error);
				return null;
			}
		}
	})
);

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
	secret: AUTH_SECRET,
	trustHost: true,
	session: {
		strategy: 'jwt',
		maxAge: maxAge
	},
	callbacks: {
		jwt: async ({ token, user, account }) => {
			// Initial sign in
			if (account && user) {
				console.log('Initial sign in - Account:', {
					provider: account.provider,
					hasAccessToken: !!account.access_token,
					hasRefreshToken: !!account.refresh_token,
					expiresAt: account.expires_at
				});

				token.userId = user.id;
				token.hasuraRole = 'user';
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.expires_at = account.expires_at;
				return token;
			}

			// Token is still valid
			if (Date.now() < (token.expires_at as number) * 1000) {
				return token;
			}

			// Token has expired, try to refresh it
			console.log('Refreshing token');
			try {
				const response = await fetch('https://oauth2.googleapis.com/token', {
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						client_id: AUTH_GOOGLE_ID,
						client_secret: AUTH_GOOGLE_SECRET,
						grant_type: 'refresh_token',
						refresh_token: token.refreshToken as string
					}),
					method: 'POST'
				});

				const newTokens = await response.json();

				if (!response.ok) {
					console.error('Error refreshing token:', newTokens);
					throw newTokens;
				}

				console.log('Token refreshed successfully');
				return {
					...token,
					accessToken: newTokens.access_token,
					expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
					refreshToken: newTokens.refresh_token ?? token.refreshToken
				};
			} catch (error) {
				console.error('Error refreshing access token', error);
				return { ...token, error: 'RefreshAccessTokenError' };
			}
		},
		session: async ({ session, token }) => {
			if (token && token.userId) {
				session.user.id = token.userId as string;
				session.hasuraRole = token.hasuraRole as string;
				session.accessToken = token.accessToken as string;
				session.error = token.error as string | undefined;

				console.log('Session callback - has access token:', !!session.accessToken);
			}
			return session;
		}
	}
});

const securityHandle: Handle = async ({ event, resolve }) => {
	const url = event.url;
	const session = await event.locals.auth();
	const isBoardRoute = url.pathname.match(/^\/[^/]+\/[^/]+\/[^/]+/);

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
