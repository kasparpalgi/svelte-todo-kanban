<!-- @file src/lib/components/listBoard/SortableBoardItem.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Trash2,
		SquarePen,
		GripVertical,
		Ellipsis,
		Users,
		Globe
	} from 'lucide-svelte';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS } from '@dnd-kit-svelte/utilities';
	import githubLogo from '$lib/assets/github.svg';

	interface Props {
		board: any;
		editingBoard: { id: string; name: string; github?: string | null } | null;
		todoCountByBoard: Map<string, number>;
		hasGithubConnected: boolean;
		activeId: string | null;
		onStartEdit: (board: any) => void;
		onUpdateBoard: (id: string, name: string) => void;
		onBoardKeydown: (event: KeyboardEvent, id: string, name: string) => void;
		onOpenMembers: (board: any) => void;
		onOpenVisibility: (board: any) => void;
		onOpenGithub: (board: any) => void;
		onDelete: (id: string, name: string) => void;
	}

	let {
		board,
		editingBoard,
		todoCountByBoard,
		hasGithubConnected,
		activeId,
		onStartEdit,
		onUpdateBoard,
		onBoardKeydown,
		onOpenMembers,
		onOpenVisibility,
		onOpenGithub,
		onDelete
	}: Props = $props();

	const sortable = useSortable({ id: board.id });
	const { attributes, listeners, setNodeRef, transform, transition } = sortable;

	const style = $derived(
		transform
			? `transform: ${CSS.Transform.toString(transform)}; transition: ${transition || ''};`
			: ''
	);

	let nodeRef = $state<HTMLElement>();

	$effect(() => {
		if (nodeRef) {
			setNodeRef(nodeRef);
		}
	});
</script>

<div
	bind:this={nodeRef}
	{style}
	class="flex items-center gap-2 rounded border p-2 {activeId === board.id ? 'opacity-50' : ''}"
>
	<button {...attributes} {...listeners} class="cursor-grab active:cursor-grabbing">
		<GripVertical class="h-4 w-4 text-muted-foreground" />
	</button>

	{#if editingBoard?.id === board.id}
		<Input
			bind:value={editingBoard.name}
			class="h-8 flex-1"
			onkeydown={(e) => onBoardKeydown(e, board.id, editingBoard?.name || '')}
			onblur={() => onUpdateBoard(board.id, editingBoard?.name || '')}
		/>
	{:else}
		<div class="flex flex-1 flex-col gap-1">
			<span class="font-medium">{board.name}</span>
			{#if board.github}
				<span class="flex items-center gap-1 text-xs text-muted-foreground">
					<img src={githubLogo} alt="GitHub" class="h-4 w-4" />
					{board.github}
				</span>
			{/if}
		</div>
	{/if}

	<Badge variant="outline" class="text-xs">
		{todoCountByBoard.get(board.id) || 0} tasks
	</Badge>

	<DropdownMenu>
		<DropdownMenuTrigger>
			<Button variant="ghost" size="sm" class="h-6 w-6 p-0">
				<Ellipsis class="h-3 w-3" />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem onclick={() => onStartEdit(board)}>
				<SquarePen class="mr-2 h-3 w-3" />
				Edit Name
			</DropdownMenuItem>
			<DropdownMenuItem onclick={() => onOpenMembers(board)}>
				<Users class="mr-2 h-3 w-3" />
				Manage Members
			</DropdownMenuItem>
			<DropdownMenuItem onclick={() => onOpenVisibility(board)}>
				<Globe class="mr-2 h-3 w-3" />
				Sharing & Visibility
			</DropdownMenuItem>
			{#if hasGithubConnected}
				<DropdownMenuItem onclick={() => onOpenGithub(board)}>
					<img src={githubLogo} alt="GitHub" class="mr-2 h-3 w-3" />
					{board.github ? 'Change' : 'Connect'} GitHub Repo
				</DropdownMenuItem>
			{/if}
			<DropdownMenuSeparator />
			<DropdownMenuItem onclick={() => onDelete(board.id, board.name)} class="text-red-600">
				<Trash2 class="mr-2 h-3 w-3" />
				Delete
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</div>
