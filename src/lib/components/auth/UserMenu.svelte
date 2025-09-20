<!-- @file src/lib/components/auth/UserMenu.svelte -->
<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { LogOut, User } from 'lucide-svelte';

	let session = $derived(page.data.session);
</script>

{#if session?.user}
	<div class="flex items-center gap-4">
		<span class="text-sm font-medium">{session.user.name || session.user.email}</span>
		<Button onclick={() => signOut({ callbackUrl: '/' })} variant="outline" size="sm">
			<LogOut class="mr-2 h-4 w-4" />
			Sign Out
		</Button>
	</div>
{:else}
	<Button href="/auth/signin" variant="outline">
		<User class="mr-2 h-4 w-4" />
		Sign In
	</Button>
{/if}
