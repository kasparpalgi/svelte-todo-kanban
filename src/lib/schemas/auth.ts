/** @file src/lib/schemas/auth.ts */
import { z } from 'zod';

export const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.max(100, 'Password must be less than 100 characters')
	.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
	.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
	.regex(/[0-9]/, 'Password must contain at least one number');

export const signupSchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
		email: z.string().email('Invalid email address'),
		password: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required')
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
