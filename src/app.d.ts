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

export {};
