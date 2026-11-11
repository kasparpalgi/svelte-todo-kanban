/** @file svelte.config.js  */
import autoAdapter from '@sveltejs/adapter-auto';
import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Cloudflare Workers is the target (#218). Vercel sets VERCEL=1 in its builds, so
// pushes to main keep deploying there until the cut-over; drop this branch then.
const adapter = process.env.VERCEL ? autoAdapter() : cloudflareAdapter();

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
