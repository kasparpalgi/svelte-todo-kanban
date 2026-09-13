/** @file vite.config.ts */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';

// Compiles service-worker.ts into .svelte-kit/output/client/service-worker.js
// during buildStart, before either client or SSR builds initialize. On Linux
// (Vercel), Vite 7 runs client and SSR builds concurrently, and the client's
// emptyOutDir clears .svelte-kit/output/client/ before we can build anything.
// Using buildStart ensures the file exists before Vite initializes either
// environment. The @vite-pwa/sveltekit:build plugin reads this file during its
// closeBundle hook, so it must exist before that point.
function buildSwBeforePwa(): Plugin {
	return {
		name: 'build-sw-before-pwa',
		apply: 'build',
		enforce: 'pre',
		async buildStart() {
			const [{ mkdirSync }, { build: esbuild }] = await Promise.all([
				import('fs'),
				import('esbuild')
			]);
			mkdirSync('.svelte-kit/output/client', { recursive: true });
			await esbuild({
				entryPoints: ['src/service-worker.ts'],
				bundle: true,
				format: 'esm',
				outfile: '.svelte-kit/output/client/service-worker.js',
				platform: 'browser',
				define: { 'process.env.NODE_ENV': '"production"' }
			});
		}
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		buildSwBeforePwa(),
		SvelteKitPWA({
			srcDir: './src',
			mode: 'production',
			scope: '/',
			base: '/',
			selfDestroying: false,
			strategies: 'injectManifest',
			filename: 'service-worker.ts',
			injectManifest: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}']
			},
			manifest: {
				short_name: 'ToDzz',
				name: 'ToDzz',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#19183B',
				background_color: '#A1C2BD',
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			devOptions: {
				enabled: false,
				suppressWarnings: true,
				type: 'module'
			},
			kit: {}
		})
	],
	server: {
		port: 5173,
		fs: {
			allow: ['..']
		}
	},
	ssr: {
		noExternal: process.env.NODE_ENV === 'production' ? [] : undefined
	},
	build: {
		target: 'es2015'
	},
	optimizeDeps: {
		exclude: ['puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', '@sveltejs/kit'] // TODO: try to optimise '@sveltejs/kit' for better performance or it was breaking?
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }],
						headless: true
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['vitest-browser-svelte', './vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					alias: {
						'$app/environment': './src/mocks/app-environment.js',
						'$app/stores': './src/mocks/app-stores.js'
					}
				}
			}
		]
	}
});
