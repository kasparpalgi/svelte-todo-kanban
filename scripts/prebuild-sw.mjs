/**
 * Pre-compiles src/service-worker.ts into .svelte-kit/output/client/service-worker.js
 * before the main Vite build starts.
 *
 * On Linux (Vercel), Vite fires the SSR environment's closeBundle hook immediately
 * after the SSR build phase completes — before the client build has created
 * service-worker.js. The @vite-pwa/sveltekit SSR closeBundle then fails with ENOENT.
 *
 * By pre-compiling here the file always exists when that hook fires.
 * The client build's own buildSW step will overwrite this file anyway with the
 * correctly-manifested version, so the pre-compiled content is only a placeholder.
 */
import { build } from 'esbuild';
import { mkdirSync } from 'fs';

mkdirSync('.svelte-kit/output/client', { recursive: true });

await build({
	entryPoints: ['src/service-worker.ts'],
	bundle: true,
	format: 'esm',
	outfile: '.svelte-kit/output/client/service-worker.js',
	platform: 'browser',
	define: { 'process.env.NODE_ENV': '"production"' },
});
