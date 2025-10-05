/** @file src/routes/api/github/webhook/__tests__/signature.test.ts */
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { mockWebhookSignature, mockGithubIssueEvent } from '$lib/test-utils/github-mocks';

/**
 * Tests for webhook signature verification logic
 * This tests the HMAC SHA-256 signature generation and validation
 */

describe('Webhook Signature Verification', () => {
	const testSecret = 'test-webhook-secret-123';

	describe('Signature Generation', () => {
		it('should generate correct HMAC SHA-256 signature', () => {
			const payload = JSON.stringify({ test: 'data' });
			const signature = mockWebhookSignature(payload, testSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
		});

		it('should generate different signatures for different payloads', () => {
			const payload1 = JSON.stringify({ data: 'first' });
			const payload2 = JSON.stringify({ data: 'second' });

			const sig1 = mockWebhookSignature(payload1, testSecret);
			const sig2 = mockWebhookSignature(payload2, testSecret);

			expect(sig1).not.toBe(sig2);
		});

		it('should generate different signatures for different secrets', () => {
			const payload = JSON.stringify({ test: 'data' });
			const secret1 = 'secret-one';
			const secret2 = 'secret-two';

			const sig1 = mockWebhookSignature(payload, secret1);
			const sig2 = mockWebhookSignature(payload, secret2);

			expect(sig1).not.toBe(sig2);
		});

		it('should generate same signature for same payload and secret', () => {
			const payload = JSON.stringify({ test: 'data' });

			const sig1 = mockWebhookSignature(payload, testSecret);
			const sig2 = mockWebhookSignature(payload, testSecret);

			expect(sig1).toBe(sig2);
		});

		it('should handle empty payload', () => {
			const payload = '';
			const signature = mockWebhookSignature(payload, testSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
		});

		it('should handle complex JSON payload', () => {
			const event = mockGithubIssueEvent({
				action: 'edited',
				issue: {
					id: 999,
					number: 5,
					title: 'Complex Issue',
					body: 'With\nMultiple\nLines',
					labels: [
						{ name: 'bug', color: 'red' },
						{ name: 'priority: high', color: 'orange' }
					]
				}
			});

			const payload = JSON.stringify(event);
			const signature = mockWebhookSignature(payload, testSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
		});
	});

	describe('Signature Validation', () => {
		/**
		 * Simulates the server-side verification logic
		 */
		function verifySignature(payload: string, providedSignature: string, secret: string): boolean {
			const hmac = crypto.createHmac('sha256', secret);
			const expectedSignature = 'sha256=' + hmac.update(payload).digest('hex');

			// Use constant-time comparison
			if (providedSignature.length !== expectedSignature.length) {
				return false;
			}

			return crypto.timingSafeEqual(
				Buffer.from(providedSignature),
				Buffer.from(expectedSignature)
			);
		}

		it('should validate correct signature', () => {
			const payload = JSON.stringify({ action: 'opened' });
			const signature = mockWebhookSignature(payload, testSecret);

			const isValid = verifySignature(payload, signature, testSecret);

			expect(isValid).toBe(true);
		});

		it('should reject invalid signature', () => {
			const payload = JSON.stringify({ action: 'opened' });
			const invalidSignature = 'sha256=invalid';

			const isValid = verifySignature(payload, invalidSignature, testSecret);

			expect(isValid).toBe(false);
		});

		it('should reject signature with wrong secret', () => {
			const payload = JSON.stringify({ action: 'opened' });
			const signature = mockWebhookSignature(payload, 'wrong-secret');

			const isValid = verifySignature(payload, signature, testSecret);

			expect(isValid).toBe(false);
		});

		it('should reject signature for modified payload', () => {
			const originalPayload = JSON.stringify({ action: 'opened' });
			const signature = mockWebhookSignature(originalPayload, testSecret);

			const modifiedPayload = JSON.stringify({ action: 'closed' });

			const isValid = verifySignature(modifiedPayload, signature, testSecret);

			expect(isValid).toBe(false);
		});

		it('should reject signature without sha256 prefix', () => {
			const payload = JSON.stringify({ action: 'opened' });
			const hmac = crypto.createHmac('sha256', testSecret);
			const signatureWithoutPrefix = hmac.update(payload).digest('hex');

			const isValid = verifySignature(payload, signatureWithoutPrefix, testSecret);

			expect(isValid).toBe(false);
		});

		it('should reject empty signature', () => {
			const payload = JSON.stringify({ action: 'opened' });

			const isValid = verifySignature(payload, '', testSecret);

			expect(isValid).toBe(false);
		});

		it('should use constant-time comparison to prevent timing attacks', () => {
			const payload = JSON.stringify({ action: 'opened' });
			const correctSignature = mockWebhookSignature(payload, testSecret);

			// Create signature that differs in the last character
			const almostCorrectSignature = correctSignature.slice(0, -1) + '0';

			// Measure time for both comparisons
			// In a vulnerable implementation, these would take different amounts of time
			const start1 = process.hrtime.bigint();
			verifySignature(payload, correctSignature, testSecret);
			const end1 = process.hrtime.bigint();
			const time1 = end1 - start1;

			const start2 = process.hrtime.bigint();
			verifySignature(payload, almostCorrectSignature, testSecret);
			const end2 = process.hrtime.bigint();
			const time2 = end2 - start2;

			// Times should be similar (constant-time comparison)
			// Allow 10x variance due to system noise
			const ratio = Number(time1) / Number(time2);
			expect(ratio).toBeLessThan(10);
			expect(ratio).toBeGreaterThan(0.1);
		});
	});

	describe('Edge Cases', () => {
		it('should handle unicode characters in payload', () => {
			const payload = JSON.stringify({ message: 'Hello 世界 🌍' });
			const signature = mockWebhookSignature(payload, testSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);

			// Verify it can be validated
			const hmac = crypto.createHmac('sha256', testSecret);
			const expected = 'sha256=' + hmac.update(payload).digest('hex');

			expect(signature).toBe(expected);
		});

		it('should handle special characters in secret', () => {
			const payload = JSON.stringify({ test: 'data' });
			const specialSecret = '!@#$%^&*()_+-=[]{}|;:,.<>?';

			const signature = mockWebhookSignature(payload, specialSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
		});

		it('should handle very long payload', () => {
			const largePayload = JSON.stringify({
				data: 'x'.repeat(100000)
			});

			const signature = mockWebhookSignature(largePayload, testSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
		});

		it('should handle payload with newlines and whitespace', () => {
			const payload = `{
				"action": "opened",
				"issue": {
					"id": 123,
					"title": "Test"
				}
			}`;

			const signature = mockWebhookSignature(payload, testSecret);

			expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
		});
	});
});
