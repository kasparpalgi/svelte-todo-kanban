// @file src/routes/[[lang]]/+layout.ts
import type { LayoutLoad } from './$types';
import { initTranslations } from '$lib/i18n';

export const load: LayoutLoad = async ({ data, params }) => {
	const currentLocale = params.lang || 'en';

	await initTranslations(currentLocale);

	return data;
};
