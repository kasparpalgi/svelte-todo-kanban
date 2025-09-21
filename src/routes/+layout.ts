/** @file src/routes/+layout.ts */
import type { LayoutLoad } from './$types';
import { initTranslations } from '$lib/i18n';

export const load: LayoutLoad = async ({ data }) => {
	await initTranslations(data.locale);
	return data;
};
