<!-- @file src/lib/components/ui/ConfirmDialog.svelte -->
<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, Trash2, FileX } from 'lucide-svelte';

	interface ConfirmDialogProps {
		open: boolean;
		title: string;
		description: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'destructive' | 'warning' | 'default';
		icon?: 'warning' | 'delete' | 'unsaved';
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open = $bindable(),
		title,
		description,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default',
		icon = 'warning',
		onConfirm,
		onCancel
	}: ConfirmDialogProps = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			handleCancel();
		}
	}

	const iconMap = {
		warning: AlertTriangle,
		delete: Trash2,
		unsaved: FileX
	};

	const IconComponent = iconMap[icon];
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	<DialogContent class="max-w-md">
		<DialogHeader class="space-y-4">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {variant ===
					'destructive'
						? 'bg-red-100 text-red-600'
						: variant === 'warning'
							? 'bg-amber-100 text-amber-600'
							: 'bg-blue-100 text-blue-600'}"
				>
					<IconComponent class="h-5 w-5" />
				</div>
				<div class="flex-1">
					<DialogTitle class="text-left text-lg font-semibold">{title}</DialogTitle>
				</div>
			</div>
			<DialogDescription class="text-left text-sm text-muted-foreground">
				{description}
			</DialogDescription>
		</DialogHeader>

		<div class="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
			<Button variant="outline" onclick={handleCancel} class="sm:w-auto">
				{cancelText}
			</Button>
			<Button
				variant={variant === 'destructive' ? 'destructive' : 'default'}
				onclick={handleConfirm}
				class="sm:w-auto"
			>
				{confirmText}
			</Button>
		</div>
	</DialogContent>
</Dialog>