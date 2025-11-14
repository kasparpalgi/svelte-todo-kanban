/** @file src/lib/i18n.ts */
import i18n from 'sveltekit-i18n';

const config = {
	fallbackLocale: 'en',
	initialLocale: 'en',
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

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);

export async function initTranslations(currentLocale: string) {
	console.log('[i18n] initTranslations called with locale:', currentLocale);
	await loadTranslations(currentLocale);
	locale.set(currentLocale);
	console.log('[i18n] Translations loaded, current locale:', currentLocale);
}
