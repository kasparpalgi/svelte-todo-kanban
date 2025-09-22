/** @file src/lib/schemas/todo.ts */
import { z } from 'zod';

export const todoEditSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(200, 'Title must be less than 200 characters')
		.trim(),
	content: z
		.string()
		.max(1000, 'Content must be less than 1000 characters')
		.optional()
		.transform((val) => (val === '' ? undefined : val)),
	due_on: z
		.string()
		.optional()
		.transform((val) => (val === '' ? undefined : val))
		.refine(
			(val) => {
				if (!val) return true;
				const date = new Date(val);
				return !isNaN(date.getTime());
			},
			{ message: 'Invalid date format' }
		)
});

export const imageUploadSchema = z.object({
	file: z
		.instanceof(File)
		.refine((file) => file.type.startsWith('image/'), {
			message: 'File must be an image'
		})
		.refine((file) => file.size <= 5 * 1024 * 1024, {
			message: 'File size must be less than 5MB'
		}),
	name: z.string().min(1, 'Filename is required')
});

export type TodoEditData = z.infer<typeof todoEditSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>;
