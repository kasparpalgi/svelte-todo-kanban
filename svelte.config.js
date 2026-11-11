/** @file svelte.config.js  */
import vercelAdapter from '@sveltejs/adapter-vercel';
import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Cloudflare Workers is the target (#218). Vercel sets VERCEL=1 in its builds, so
// pushes to main keep deploying there until the cut-over; drop this branch then.
// arn1 (Stockholm) sits next to Hasura in Helsinki and the users. Vercel's default,
// iad1 (Washington), put an Atlantic round trip on every token mint and query (#213).
const adapter = process.env.VERCEL ? vercelAdapter({ regions: ['arn1'] }) : cloudflareAdapter();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter,
		serviceWorker: {
			register: false
		}
	}
};

export default config;
