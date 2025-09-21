<!-- @file src/lib/components/auth/UserMenu.svelte -->
<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { LogOut, User } from 'lucide-svelte';

	let session = $derived(page.data.session);

	function getUserInitials(name?: string | null, email?: string | null): string {
		if (name) {
			return name
				.split(' ')
				.map((n) => n.charAt(0))
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		if (email) {
			return email.charAt(0).toUpperCase();
		}
		return 'U';
	}
</script>

{#if session?.user}
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-3">
			<div class="relative h-8 w-8 overflow-hidden rounded-full">
				{#if session.user.image}
					<img
						src={session.user.image}
						alt={session.user.name || session.user.email || $t('auth.user')}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center bg-muted text-xs font-medium">
						{getUserInitials(session.user.name, session.user.email)}
					</div>
				{/if}
			</div>
			<span class="text-sm font-medium">{session.user.name || session.user.email}</span>
		</div>
		<Button onclick={() => signOut({ callbackUrl: '/' })} variant="outline" size="sm">
			<LogOut class="mr-2 h-4 w-4" />
			{$t('auth.sign_out')}
		</Button>
	</div>
{:else}
	<Button href="/auth/signin" variant="outline">
		<User class="mr-2 h-4 w-4" />
		{$t('auth.sign_in')}
	</Button>
{/if}
