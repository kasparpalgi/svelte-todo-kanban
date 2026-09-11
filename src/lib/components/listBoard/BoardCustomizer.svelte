<!-- @file src/lib/components/listBoard/BoardCustomizer.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Check, Palette } from 'lucide-svelte';
	import { listsStore } from '$lib/stores/listsBoards.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import {
		ICON_PRESETS,
		COLOR_PRESETS,
		BACKGROUND_PRESETS,
		getBoardCustomization
	} from '$lib/constants/boardCustomization';
	import type { CustomizeProps } from '$lib/types/listBoard';

	let { board, open = $bindable(), onClose }: CustomizeProps = $props();

	let icon = $state('');
	let color = $state('');
	let background = $state('none');
	let saving = $state(false);

	// Sync local draft from the board whenever the dialog opens.
	$effect(() => {
		if (open) {
			const current = getBoardCustomization(board);
			icon = current.icon;
			color = current.color;
			background = current.backgroundId;
		}
	});

	const previewStyle = $derived(BACKGROUND_PRESETS.find((b) => b.id === background)?.style || '');

	function toggleIcon(value: string) {
		icon = icon === value ? '' : value;
	}

	function toggleColor(value: string) {
		color = color === value ? '' : value;
	}

	async function handleSave() {
		saving = true;

		// Merge into existing settings so unrelated keys (agent_list_id, etc.) survive.
		const existing = board.settings && typeof board.settings === 'object' ? board.settings : {};

		const result = await listsStore.updateBoard(board.id, {
			settings: {
				...existing,
				icon: icon || null,
				color: color || null,
				background: background === 'none' ? null : background
			}
		});

		saving = false;

		if (result.success) {
			displayMessage($t('board.customization_updated'), 1500, true);
			onClose();
		} else {
			displayMessage(result.message);
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-lg">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Palette class="h-5 w-5" />
				{$t('board.customize_board')}
			</DialogTitle>
			<DialogDescription>
				{$t('board.customize_description')}
				{board.name}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6">
			<!-- Live preview -->
			<div
				class="flex items-center gap-3 rounded-lg border p-4"
				style={previewStyle ? `background: ${previewStyle};` : ''}
			>
				<span
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xl"
					style={color ? `border-color: ${color}; color: ${color};` : ''}
				>
					{icon || '📋'}
				</span>
				<div class="min-w-0">
					<div class="truncate font-semibold" style={color ? `color: ${color};` : ''}>
						{board.name}
					</div>
					<div class="text-xs text-muted-foreground">{$t('board.preview')}</div>
				</div>
			</div>

			<!-- Icon picker -->
			<div class="space-y-2">
				<span class="text-sm font-medium">{$t('board.icon')}</span>
				<div class="flex flex-wrap gap-2">
					{#each ICON_PRESETS as preset (preset)}
						<button
							type="button"
							onclick={() => toggleIcon(preset)}
							aria-pressed={icon === preset}
							class="flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors hover:bg-accent {icon ===
							preset
								? 'border-primary bg-accent ring-2 ring-primary'
								: ''}"
						>
							{preset}
						</button>
					{/each}
				</div>
			</div>

			<!-- Color picker -->
			<div class="space-y-2">
				<span class="text-sm font-medium">{$t('board.accent_color')}</span>
				<div class="flex flex-wrap gap-2">
					{#each COLOR_PRESETS as preset (preset.value)}
						<button
							type="button"
							onclick={() => toggleColor(preset.value)}
							aria-pressed={color === preset.value}
							aria-label={$t(`board.color_${preset.labelKey}`)}
							title={$t(`board.color_${preset.labelKey}`)}
							class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 {color ===
							preset.value
								? 'ring-2 ring-offset-2 ring-offset-background'
								: 'border-transparent'}"
							style="background-color: {preset.value}; {color === preset.value
								? `--tw-ring-color: ${preset.value};`
								: ''}"
						>
							{#if color === preset.value}
								<Check class="h-4 w-4 text-white" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Background picker -->
			<div class="space-y-2">
				<span class="text-sm font-medium">{$t('board.background')}</span>
				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{#each BACKGROUND_PRESETS as preset (preset.id)}
						<button
							type="button"
							onclick={() => (background = preset.id)}
							aria-pressed={background === preset.id}
							class="relative flex h-12 items-center justify-center rounded-md border text-xs text-muted-foreground transition-colors {background ===
							preset.id
								? 'border-primary ring-2 ring-primary'
								: ''}"
							style={preset.style ? `background: ${preset.style};` : ''}
						>
							{$t(`board.bg_${preset.labelKey}`)}
							{#if background === preset.id}
								<Check class="absolute top-1 right-1 h-3 w-3 text-primary" />
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={onClose} disabled={saving}>{$t('common.cancel')}</Button>
			<Button onclick={handleSave} disabled={saving}>{$t('common.save')}</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
