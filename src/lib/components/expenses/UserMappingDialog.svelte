<script lang="ts">
	/** @file src/lib/components/expenses/UserMappingDialog.svelte */
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import type { GetBoardMembersQuery } from '$lib/graphql/generated/graphql';

	type BoardMember = GetBoardMembersQuery['board_members'][number];

	interface Props {
		open: boolean;
		csvUserNames: string[];
		boardMembers: BoardMember[];
		onOpenChange: (open: boolean) => void;
		onConfirm: (mapping: Map<string, string>) => void; // csvUserName -> boardMemberUserId
	}

	let { open = $bindable(), csvUserNames, boardMembers, onOpenChange, onConfirm }: Props = $props();

	// Map CSV user names to board member user IDs
	let userMapping = $state<Map<string, string>>(new Map());

	// Reset mapping when dialog opens
	$effect(() => {
		if (open) {
			userMapping = new Map();
		}
	});

	// Check if all users are mapped
	const allMapped = $derived(
		csvUserNames.every(name => userMapping.has(name) && userMapping.get(name) !== '')
	);

	function setMapping(csvUserName: string, userId: string) {
		userMapping.set(csvUserName, userId);
		userMapping = new Map(userMapping); // Trigger reactivity
	}

	function handleConfirm() {
		if (allMapped) {
			onConfirm(userMapping);
			onOpenChange(false);
		}
	}

	function handleCancel() {
		onOpenChange(false);
	}
</script>

<Dialog {open} onOpenChange={onOpenChange}>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>Identify Users in CSV</DialogTitle>
			<DialogDescription>
				Please identify which board member each CSV user name corresponds to.
				Make sure to correctly map yourself and other users.
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4 py-4">
			{#each csvUserNames as csvUserName}
				<div class="space-y-2">
					<Label for={`mapping-${csvUserName}`}>
						CSV User: <strong>{csvUserName}</strong>
					</Label>
					<select
						id={`mapping-${csvUserName}`}
						value={userMapping.get(csvUserName) || ''}
						onchange={(e) => setMapping(csvUserName, e.currentTarget.value)}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="">Select board member</option>
						{#each boardMembers as member}
							<option value={member.user_id}>
								{member.user?.name || member.user?.username || 'Unknown'}
							</option>
						{/each}
					</select>
				</div>
			{/each}

			{#if !allMapped}
				<p class="text-sm text-muted-foreground">
					Please map all users before continuing.
				</p>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleCancel}>Cancel</Button>
			<Button onclick={handleConfirm} disabled={!allMapped}>
				Continue Import
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
