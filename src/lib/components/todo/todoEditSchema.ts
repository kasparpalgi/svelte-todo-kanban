/** @file src/lib/components/todo/todoEditSchema.ts — inline card edit validation; TodoItem loads it on first save so zod stays off the server render (#248). */
import { z } from 'zod';

export function createTodoEditSchema(t: (key: string) => string) {
	return z.object({
		title: z
			.string()
			.min(1, t('validation.title_required'))
			.max(200, t('validation.title_max_length'))
			.trim(),
		content: z
			.string()
			.max(1000, t('validation.content_max_length'))
			.optional()
			.transform((val) => (val === '' ? undefined : val)),
		due_on: z
			.string()
			.optional()
			.transform((val) => (val === '' ? undefined : val))
			.refine(
				(val) => {
					if (!val) return true;
					return !isNaN(new Date(val).getTime());
				},
				{ message: t('validation.invalid_date') }
			)
	});
}

export type TodoEditData = z.infer<ReturnType<typeof createTodoEditSchema>>;
