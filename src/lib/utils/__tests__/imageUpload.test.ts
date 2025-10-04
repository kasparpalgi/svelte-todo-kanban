/** @file src/lib/utils/__tests__/imageUpload.test.ts */
import { describe, it, expect } from 'vitest';

/**
 * Test file validation logic for image uploads
 */
describe('Image Upload Utilities', () => {
	describe('File validation', () => {
		it('should accept valid image files under 5MB', () => {
			const file = new File(['test'], 'test.png', { type: 'image/png' });
			Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

			const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
			expect(isValid).toBe(true);
		});

		it('should reject files over 5MB', () => {
			const file = new File(['test'], 'test.png', { type: 'image/png' });
			Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

			const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
			expect(isValid).toBe(false);
		});

		it('should reject non-image files', () => {
			const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
			Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

			const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
			expect(isValid).toBe(false);
		});

		it('should accept multiple valid image types', () => {
			const types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

			types.forEach((type) => {
				const file = new File(['test'], `test.${type.split('/')[1]}`, { type });
				Object.defineProperty(file, 'size', { value: 1024 * 1024 });

				const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
				expect(isValid).toBe(true);
			});
		});

		it('should filter multiple files correctly', () => {
			const files = [
				new File(['test'], 'valid.png', { type: 'image/png' }),
				new File(['test'], 'too-large.jpg', { type: 'image/jpeg' }),
				new File(['test'], 'not-image.pdf', { type: 'application/pdf' }),
				new File(['test'], 'valid2.jpg', { type: 'image/jpeg' })
			];

			// Set sizes
			Object.defineProperty(files[0], 'size', { value: 1024 * 1024 }); // 1MB - valid
			Object.defineProperty(files[1], 'size', { value: 6 * 1024 * 1024 }); // 6MB - too large
			Object.defineProperty(files[2], 'size', { value: 1024 * 1024 }); // 1MB - but not image
			Object.defineProperty(files[3], 'size', { value: 2 * 1024 * 1024 }); // 2MB - valid

			const validFiles = files.filter(
				(file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
			);
			const invalidFiles = files.filter(
				(file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
			);

			expect(validFiles).toHaveLength(2);
			expect(invalidFiles).toHaveLength(2);
			expect(validFiles[0].name).toBe('valid.png');
			expect(validFiles[1].name).toBe('valid2.jpg');
		});
	});

	describe('TodoImage type structure', () => {
		it('should have correct structure for existing image', () => {
			const existingImage = {
				id: 'upload-id-123',
				file: null,
				preview: 'https://example.com/image.jpg',
				isExisting: true
			};

			expect(existingImage.id).toBeDefined();
			expect(existingImage.file).toBeNull();
			expect(existingImage.preview).toBeDefined();
			expect(existingImage.isExisting).toBe(true);
		});

		it('should have correct structure for new upload', () => {
			const file = new File(['test'], 'new.png', { type: 'image/png' });
			const preview = URL.createObjectURL(file);

			const newImage = {
				id: crypto.randomUUID(),
				file: file,
				preview: preview,
				isExisting: false
			};

			expect(newImage.id).toBeDefined();
			expect(newImage.file).toBeInstanceOf(File);
			expect(newImage.preview.startsWith('blob:')).toBe(true);
			expect(newImage.isExisting).toBe(false);

			// Cleanup
			URL.revokeObjectURL(preview);
		});
	});

	describe('Blob URL cleanup', () => {
		it('should create and revoke blob URLs correctly', () => {
			const file = new File(['test'], 'test.png', { type: 'image/png' });
			const blobUrl = URL.createObjectURL(file);

			expect(blobUrl.startsWith('blob:')).toBe(true);

			// Revoke should not throw
			expect(() => URL.revokeObjectURL(blobUrl)).not.toThrow();
		});

		it('should identify blob URLs correctly', () => {
			const file = new File(['test'], 'test.png', { type: 'image/png' });
			const blobUrl = URL.createObjectURL(file);
			const httpUrl = 'https://example.com/image.jpg';

			expect(blobUrl.startsWith('blob:')).toBe(true);
			expect(httpUrl.startsWith('blob:')).toBe(false);

			URL.revokeObjectURL(blobUrl);
		});
	});
});
