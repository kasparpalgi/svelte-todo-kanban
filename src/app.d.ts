/** @file src/app.d.ts */
import type { DefaultSession } from '@auth/core/types';
// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		// interface Error {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			auth: () => Promise<Session | null>;
		}
		interface PageData {
			session?: Session;
		}
		interface Window {
			SpeechRecognition: typeof SpeechRecognition;
			webkitSpeechRecognition: typeof SpeechRecognition;
		}

		var SpeechRecognition: {
			prototype: SpeechRecognition;
			new (): SpeechRecognition;
		};

		var webkitSpeechRecognition: {
			prototype: SpeechRecognition;
			new (): SpeechRecognition;
		};
	}
}

declare module '@auth/core/types' {
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
		} & DefaultSession['user'];
		hasuraRole?: string;
	}

	interface JWT {
		userId?: string;
		hasuraRole?: string;
	}
}

declare module 'virtual:pwa-register/svelte' {
	import type { Writable } from 'svelte/store';

	export interface RegisterSWOptions {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: Error) => void;
	}

	export function useRegisterSW(options?: RegisterSWOptions): {
		needRefresh: Writable<boolean>;
		offlineReady: Writable<boolean>;
		updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
	};
}

declare module 'virtual:pwa-register/svelte' {
	import type { Writable } from 'svelte/store';

	export interface RegisterSWOptions {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: any) => void;
	}

	export function useRegisterSW(options?: RegisterSWOptions): {
		needRefresh: Writable<boolean>;
		offlineReady: Writable<boolean>;
		updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
	};
}

declare module 'virtual:pwa-register' {
	export interface RegisterSWOptions {
		immediate?: boolean;
		onNeedRefresh?: () => void;
		onOfflineReady?: () => void;
		onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (error: any) => void;
	}

	export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'virtual:pwa-info' {
	export interface PwaInfo {
		pwaInDevEnvironment: boolean;
		webManifest: {
			href: string;
			linkTag: string;
		};
	}

	export const pwaInfo: PwaInfo | undefined;
}

export {};
