/** @file src/lib/i18n.ts */
import i18n from 'sveltekit-i18n';
import { DEFAULT_LOCALE } from '$lib/constants/locale';

const config = {
	// The server renders before any locale is loaded and warned once per key, which cost
	// Worker CPU on every page (#236). Errors still log.
	log: { level: 'error' as const },
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: DEFAULT_LOCALE,
	loaders: [
		{
			locale: 'en',
			key: '',
			loader: async () => (await import('../locales/en/common.json')).default
		},
		{
			locale: 'cs',
			key: '',
			loader: async () => (await import('../locales/cs/common.json')).default
		},
		{
			locale: 'et',
			key: '',
			loader: async () => (await import('../locales/et/common.json')).default
		}
	]
};

export const { t, locale, loadTranslations } = new i18n(config);

export async function initTranslations(currentLocale: string) {
	await loadTranslations(currentLocale);
	locale.set(currentLocale);
}
