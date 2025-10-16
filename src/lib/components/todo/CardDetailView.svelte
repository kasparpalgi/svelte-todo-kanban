<!-- @file src/lib/components/todo/CardDetailView.svelte -->
<script lang="ts">
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n';
	import { z } from 'zod';
	import { todosStore } from '$lib/stores/todos.svelte';
	import { displayMessage } from '$lib/stores/errorSuccess.svelte';
	import { todoEditSchema, getPriorityColor, getPriorityLabel } from '$lib/utils/cardHelpers';
	import { parseDate } from '@internationalized/date';
	import { cn } from '$lib/utils';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Calendar as CalendarPrimitive } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { X, Calendar as CalendarIcon, Tag } from 'lucide-svelte';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import CardLabelManager from '$lib/components/todo/CardLabelManager.svelte';
	import CardImageManager from '$lib/components/card/CardImageManager.svelte';
	import CardComments from '$lib/components/card/CardComments.svelte';
	import CardHourTracking from '$lib/components/todo/CardHourTracking.svelte';
	import type { Readable } from 'svelte/store';
	import type { Editor } from 'svelte-tiptap';
	import type { TodoFieldsFragment } from '$lib/graphql/generated/graphql';
	import type { DateValue } from '@internationalized/date';

	type Priority = 'low' | 'medium' | 'high';

	let { todo, lang, onClose }: { todo: TodoFieldsFragment; lang: string; onClose: () => void } =
		$props();

	let editData = $state({
		title: todo.title,
		due_on: todo.due_on ? new Date(todo.due_on).toISOString().split('T')[0] : '',
		priority: (todo.priority as Priority | null) ?? null,
		min_hours: todo.min_hours ?? null,
		max_hours: todo.max_hours ?? null,
		actual_hours: todo.actual_hours ?? null,
		comment_hours: todo.comment_hours || ''
	});
	let selectedDate = $state<DateValue | undefined>(
		editData.due_on ? parseDate(editData.due_on) : undefined
	);
	let datePickerOpen = $state(false);
	let validationErrors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);
	let editor: Readable<Editor> | null = $state(null);
	let imageManager = $state<CardImageManager>();

	$effect(() => {
		if (selectedDate) {
			editData.due_on = `${selectedDate.year}-${String(selectedDate.month).padStart(
				2,
				'0'
			)}-${String(selectedDate.day).padStart(2, '0')}`;
		} else if (selectedDate === undefined && editData.due_on) {
			editData.due_on = '';
		}
	});

	function formatDate(date: DateValue | undefined, locale: string): string {
		if (!date) return '';

		const jsDate = new Date(date.year, date.month - 1, date.day);
		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(jsDate);
	}

	async function saveTodo() {
		if (isSubmitting || !todo || !editor) {
			console.warn('CardDetailView: saveTodo() aborted due to guard conditions.');
			return;
		}

		try {
			const content = get(editor).getHTML();

			const validatedData = todoEditSchema.parse({
				...editData,
				content
			});

			validationErrors = {};
			isSubmitting = true;

			const result = await todosStore.updateTodo(todo.id, {
				title: validatedData.title,
				content: validatedData.content || null,
				due_on: validatedData.due_on || null,
				priority: validatedData.priority || null,
				min_hours: validatedData.min_hours,
				max_hours: validatedData.max_hours,
				actual_hours: validatedData.actual_hours,
				comment_hours: validatedData.comment_hours
			});

			if (!result.success) {
				displayMessage(result.message || $t('card.update_failed'));
				console.error('CardDetailView: Store update failed.', result.message);
				return;
			}

			const newImages = imageManager?.getNewImages() || [];
			if (newImages.length > 0 && todo) {
				try {
					const uploadPromises = newImages.map(async (img) => {
						const formData = new FormData();
						formData.append('file', img.file!);
						const response = await fetch('/api/upload', {
							method: 'POST',
							body: formData
						});
						const uploadResult = await response.json();
						if (uploadResult.success && todo) {
							return await todosStore.createUpload(todo.id, uploadResult.url);
						} else {
							throw new Error(uploadResult.error || 'Upload failed');
						}
					});
					await Promise.all(uploadPromises);
					displayMessage($t('card.card_and_images_updated'), 2000, true);
				} catch (error) {
					displayMessage($t('card.card_saved_upload_failed'));
					console.error('Upload error:', error);
				}
			} else {
				displayMessage($t('card.card_updated'), 1500, true);
			}

			setTimeout(() => onClose(), 300);
		} catch (error) {
			console.error('CardDetailView: An error occurred in saveTodo():', error);
			if (error instanceof z.ZodError) {
				validationErrors = {};
				error.issues.forEach((issue) => {
					if (issue.path[0]) {
						validationErrors[issue.path[0] as string] = issue.message;
					}
				});
			}
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteTodo() {
		if (!todo || !confirm($t('card.delete_card_confirm'))) return;

		const result = await todosStore.deleteTodo(todo.id);
		if (result.success) {
			displayMessage($t('card.card_deleted'), 1500, true);
			onClose();
		} else {
			displayMessage(result.message || $t('card.delete_failed'));
		}
	}

	export function save() {
		return saveTodo();
	}
</script>

<Card class="relative">
	<Button
		variant="ghost"
		size="sm"
		onclick={onClose}
		class="absolute top-2 right-2 z-10 h-7 w-7 p-0"
	>
		<X class="h-3.5 w-3.5" />
	</Button>

	<CardHeader class="pr-12 pb-4">
		<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
			<div class="flex flex-1 flex-wrap items-center gap-2">
				{#if todo.list}
					<Badge variant="secondary" class="text-xs">
						{todo.list.name}
					</Badge>
				{/if}
				{#if editData.priority}
					<Badge class="{getPriorityColor(editData.priority)} text-xs text-white">
						{getPriorityLabel(editData.priority, $t)}
					</Badge>
				{/if}
				<CardLabelManager {todo} />
			</div>

			<Button onclick={saveTodo} disabled={isSubmitting} size="sm" class="shrink-0">
				{isSubmitting ? $t('common.saving') : $t('common.save')}
			</Button>
		</div>

		<div class="space-y-4">
			<div>
				<Label for="title">{$t('card.title_label')}</Label>
				<Input
					id="title"
					bind:value={editData.title}
					class="text-lg font-semibold"
					placeholder={$t('card.title_placeholder')}
				/>
				{#if validationErrors.title}
					<p class="mt-1 text-xs text-red-500">{validationErrors.title}</p>
				{/if}
			</div>
		</div>
	</CardHeader>

	<CardContent class="space-y-6">
		<div>
			<Label class="mb-2">{$t('card.description_label')}</Label>
			<RichTextEditor bind:editor content={todo.content || ''} />
			{#if validationErrors.content}
				<p class="mt-1 text-xs text-red-500">{validationErrors.content}</p>
			{/if}
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<Label for="due_on" class="mb-2 flex items-center gap-2">
					<CalendarIcon class="h-4 w-4" />
					{$t('card.due_date_label')}
				</Label>
				<Popover bind:open={datePickerOpen}>
					<PopoverTrigger>
						<Button
							variant="outline"
							class={cn(
								'w-full justify-start text-left font-normal',
								!selectedDate && 'text-muted-foreground'
							)}
						>
							<CalendarIcon class="mr-2 h-4 w-4" />
							{selectedDate ? formatDate(selectedDate, lang) : $t('card.pick_date')}
						</Button>
					</PopoverTrigger>
					<PopoverContent class="w-auto p-0" align="start">
						<CalendarPrimitive
							type="single"
							value={selectedDate}
							locale={lang}
							onValueChange={(date: DateValue | undefined) => {
								selectedDate = date;
								datePickerOpen = false;
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>

			<div>
				<Label for="priority" class="mb-2 flex items-center gap-2">
					<Tag class="h-4 w-4" />
					{$t('card.priority_label')}
				</Label>
				<select
					id="priority"
					bind:value={editData.priority}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<option value={null}>-</option>
					<option value="low">{$t('card.priority_low')}</option>
					<option value="medium">{$t('card.priority_medium')}</option>
					<option value="high">{$t('card.priority_high')}</option>
				</select>
			</div>
		</div>

		{#if todo.list?.board?.settings?.enable_hour_tracking}
			<CardHourTracking
				bind:min_hours={editData.min_hours}
				bind:max_hours={editData.max_hours}
				bind:actual_hours={editData.actual_hours}
				bind:comment_hours={editData.comment_hours}
			/>
		{/if}

		<CardImageManager
			bind:this={imageManager}
			todoId={todo.id}
			initialImages={todo.uploads?.map((upload) => ({
				id: upload.id,
				file: null,
				preview: upload.url,
				isExisting: true
			})) || []}
		/>

		<CardComments {todo} {lang} />

		<div class="flex justify-between border-t pt-4">
			<Button variant="destructive" onclick={deleteTodo}>
				<X class="mr-2 h-4 w-4" />
				{$t('card.delete_card')}
			</Button>

			<div class="flex gap-2">
				<Button variant="outline" onclick={onClose}>
					{$t('common.close')}
				</Button>
				<Button onclick={saveTodo} disabled={isSubmitting} size="sm">
					{isSubmitting ? $t('common.saving') : $t('common.save')}
				</Button>
			</div>
		</div>
	</CardContent>
</Card>

<style>
	:global(.ProseMirror) {
		outline: none;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.ProseMirror h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror ul),
	:global(.ProseMirror ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	:global(.ProseMirror code) {
		background-color: rgba(0, 0, 0, 0.05);
		border-radius: 0.25rem;
		padding: 0.125rem 0.25rem;
		font-family: monospace;
		font-size: 0.875em;
	}

	:global(.ProseMirror ul[data-type='taskList']) {
		list-style: none;
		padding-left: 0;
	}

	:global(.ProseMirror ul[data-type='taskList'] li) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	:global(.ProseMirror ul[data-type='taskList'] li > label) {
		flex: 0 0 auto;
		margin-top: 0.125rem;
	}

	:global(.ProseMirror ul[data-type='taskList'] li > div) {
		flex: 1 1 auto;
	}

	:global(.ProseMirror ul[data-type='taskList'] input[type='checkbox']) {
		appearance: none;
		-webkit-appearance: none;
		width: 1.125rem;
		height: 1.125rem;
		border: 2px solid #d1d5db;
		border-radius: 0.25rem;
		cursor: pointer;
		position: relative;
		background-color: white;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	:global(.dark .ProseMirror ul[data-type='taskList'] input[type='checkbox']) {
		border-color: #4b5563;
		background-color: #1f2937;
	}

	:global(.ProseMirror ul[data-type='taskList'] input[type='checkbox']:hover) {
		border-color: #9ca3af;
	}

	:global(.dark .ProseMirror ul[data-type='taskList'] input[type='checkbox']:hover) {
		border-color: #6b7280;
	}

	:global(.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked) {
		background-color: hsl(142 76% 36%);
		border-color: hsl(142 76% 36%);
	}

	:global(.dark .ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked) {
		background-color: hsl(142 70% 30%);
		border-color: hsl(142 70% 30%);
	}

	:global(.ProseMirror ul[data-type='taskList'] input[type='checkbox']:checked::after) {
		content: '';
		position: absolute;
		left: 0.28rem;
		top: 0.07rem;
		width: 0.375rem;
		height: 0.625rem;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	:global(.toolbar-checkbox) {
		appearance: none;
		-webkit-appearance: none;
		width: 0.875rem;
		height: 0.875rem;
		border: 1.5px solid #9ca3af;
		border-radius: 0.25rem;
		cursor: pointer;
		position: relative;
		background-color: white;
		transition: all 0.15s ease;
		margin: 0;
		pointer-events: none;
	}

	:global(.dark .toolbar-checkbox) {
		border-color: #4b5563;
		background-color: #1f2937;
	}

	:global(button:hover .toolbar-checkbox) {
		border-color: #6b7280;
	}

	:global(.dark button:hover .toolbar-checkbox) {
		border-color: #6b7280;
	}
</style>
