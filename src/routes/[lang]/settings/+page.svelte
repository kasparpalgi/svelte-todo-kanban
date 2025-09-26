<!-- @file src/routes/[[lang]]/settings/+page.svelte -->
<script lang="ts">
	import { PUBLIC_APP_ENV, PUBLIC_API_ENV } from "$env/static/public";
	import { t } from '$lib/i18n';
	import { userStore } from '$lib/stores/user.svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { User, Moon, Sun, Layout, List, Save } from 'lucide-svelte';
	import DevMode from '$lib/components/DevMode.svelte';

	let user = $derived(userStore.user);
	let initialized = $state(false);

	let formData = $state({
		name: '',
		email: '',
		image: '',
		locale: 'en',
		darkMode: false,
		viewMode: 'kanban' as 'kanban' | 'list'
	});

	const languages = [
		{ value: 'en', label: 'English' },
		{ value: 'cs', label: 'Čeština' }
	];

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (!user?.id) return;

		const updates = {
			name: formData.name,
			email: formData.email,
			image: formData.image,
			locale: formData.locale,
			dark_mode: formData.darkMode,
			settings: {
				...(user.settings || {}),
				viewMode: formData.viewMode
			}
		};

		loggingStore.info('SettingsPage', 'Submitting form updates', { updates });
		userStore.updateUser(user.id, updates);
	}

	async function toggleDarkMode() {
		if (!user?.id) return;

		formData.darkMode = !formData.darkMode;
		const result = await userStore.updateUser(user.id, { dark_mode: formData.darkMode });

		if (!result.success) {
			formData.darkMode = !formData.darkMode;
		}
	}

	async function toggleViewMode() {
		if (!user?.id) return;

		const newViewMode = formData.viewMode === 'kanban' ? 'list' : 'kanban';
		formData.viewMode = newViewMode;
		const result = await userStore.updateViewPreference(user.id, newViewMode);

		if (!result.success) {
			formData.viewMode = formData.viewMode === 'kanban' ? 'list' : 'kanban';
		}
	}

	$effect(() => {
		if (user && !initialized) {
			formData.name = user.name || '';
			formData.email = user.email || '';
			formData.image = user.image || '';
			formData.locale = user.locale || 'en';
			formData.darkMode = user.dark_mode || false;
			formData.viewMode = user.settings?.viewMode || 'kanban';
			initialized = true;
		}
	});
</script>

<svelte:head>
	<title>{$t('settings.title')} - ToDzz</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold tracking-tight">{$t('settings.title')}</h1>
		<p class="text-muted-foreground">{$t('settings.description')}</p>
	</div>

	{#if !user}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">{$t('common.please_sign_in')}</p>
			</CardContent>
		</Card>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<User class="h-5 w-5" />
						{$t('settings.profile.title')}
					</CardTitle>
					<CardDescription>{$t('settings.profile.description')}</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="name">{$t('settings.profile.name')}</Label>
						<Input
							id="name"
							bind:value={formData.name}
							placeholder={$t('settings.profile.name_placeholder')}
						/>
					</div>

					<div class="space-y-2">
						<Label for="email">{$t('settings.profile.email')}</Label>
						<Input
							id="email"
							type="email"
							bind:value={formData.email}
							placeholder={$t('settings.profile.email_placeholder')}
						/>
					</div>

					<div class="space-y-2">
						<Label for="image">{$t('settings.profile.image')}</Label>
						<Input
							id="image"
							type="url"
							bind:value={formData.image}
							placeholder="https://example.com/your-image.jpg"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{$t('settings.appearance.title')}</CardTitle>
					<CardDescription>{$t('settings.appearance.description')}</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-2">
						<Label for="language">{$t('settings.language.select')}</Label>
						<select
							id="language"
							bind:value={formData.locale}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							{#each languages as lang}
								<option value={lang.value}>{lang.label}</option>
							{/each}
						</select>
					</div>

					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="flex items-center gap-2">
								{#if formData.darkMode}
									<Moon class="h-4 w-4" />
								{:else}
									<Sun class="h-4 w-4" />
								{/if}
								{$t('settings.appearance.dark_mode')}
							</Label>
							<p class="text-sm text-muted-foreground">
								{$t('settings.appearance.dark_mode_description')}
							</p>
						</div>
						<Switch
							checked={formData.darkMode}
							onCheckedChange={toggleDarkMode}
							disabled={userStore.loading}
						/>
					</div>

					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label class="flex items-center gap-2">
								{#if formData.viewMode === 'kanban'}
									<Layout class="h-4 w-4" />
								{:else}
									<List class="h-4 w-4" />
								{/if}
								{$t('settings.appearance.view_mode')}
							</Label>
							<p class="text-sm text-muted-foreground">
								{$t('settings.appearance.view_mode_description')}
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={toggleViewMode}
							disabled={userStore.loading}
							class="flex items-center gap-2"
						>
							{#if formData.viewMode === 'kanban'}
								<Layout class="h-4 w-4" />
								{$t('settings.appearance.kanban_view')}
							{:else}
								<List class="h-4 w-4" />
								{$t('settings.appearance.list_view')}
							{/if}
						</Button>
					</div>
				</CardContent>
			</Card>

			<div class="flex justify-start">
				<Button
					type="submit"
					disabled={userStore.loading}
					size="lg"
					class="flex items-center gap-2"
				>
					<Save class="h-4 w-4" />
					{#if userStore.loading}
						{$t('settings.saving')}
					{:else}
						{$t('settings.save_changes')}
					{/if}
				</Button>
			</div>
		</form>
		<DevMode />
	{/if}
</div>
