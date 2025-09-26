<!-- @file src/lib/components/LanguageSwitcher.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { locale, loadTranslations } from '$lib/i18n/index';

	let currentLocale = $derived($locale);
	let currentPath = $derived(page.url.pathname);

	async function switchLanguage(lang: string) {
		await loadTranslations(lang, '/');
		locale.set(lang);

		const pathWithoutLang = currentPath.replace(/^\/(en|cs)/, '') || '/';
		const newPath = lang === 'en' ? pathWithoutLang : `/${lang}${pathWithoutLang}`;

		if (!currentPath.startsWith('/signin')) {
			await goto(newPath);
		}
	}
</script>

<select
	onchange={(e) => switchLanguage((e.target as HTMLSelectElement).value)}
	value={currentLocale}
	class="rounded border bg-background px-2 py-1 text-sm"
>
	<option value="en">English</option>
	<option value="cs">Čeština</option>
</select>