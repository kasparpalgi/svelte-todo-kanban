/** @file src/lib/constants/locale.ts */

/**
 * Default locale for the application.
 * This is the single source of truth for the fallback language.
 * Change this value to set a different default language across the entire app.
 */
export const DEFAULT_LOCALE = 'en';

/**
 * Get the effective locale from multiple sources, in order of priority:
 * 1. URL parameter (most important - user is explicitly on this language URL)
 * 2. User's stored locale preference
 * 3. Default locale (fallback)
 */
export function getEffectiveLocale(
	urlLang: string | undefined,
	userLocale: string | undefined
): string {
	return urlLang || userLocale || DEFAULT_LOCALE;
}
