/** @file src/lib/server/__tests__/github.test.ts */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGithubToken, githubRequest } from '../github';
import { serverRequest } from '$lib/graphql/server-client';
import { decryptToken } from '$lib/utils/crypto';

// Mock dependencies
vi.mock('$lib/graphql/server-client');
vi.mock('$lib/utils/crypto');

describe('GitHub Server Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getGithubToken', () => {
		it('should return decrypted token for valid user with GitHub connection', async () => {
			const mockUserId = 'user-123';
			const mockEncryptedToken = 'iv:encrypted';
			const mockDecryptedToken = 'gho_decryptedtoken123';

			vi.mocked(serverRequest).mockResolvedValue({
				users_by_pk: {
					id: mockUserId,
					settings: {
						tokens: {
							github: {
								encrypted: mockEncryptedToken
							}
						}
					}
				}
			});

			vi.mocked(decryptToken).mockReturnValue(mockDecryptedToken);

			const result = await getGithubToken(mockUserId);

			expect(serverRequest).toHaveBeenCalledWith(
				expect.any(String),
				{ userId: mockUserId }
			);
			expect(decryptToken).toHaveBeenCalledWith(mockEncryptedToken);
			expect(result).toBe(mockDecryptedToken);
		});

		it('should return null for user without GitHub connection', async () => {
			const mockUserId = 'user-456';

			vi.mocked(serverRequest).mockResolvedValue({
				users_by_pk: {
					id: mockUserId,
					settings: {}
				}
			});

			const result = await getGithubToken(mockUserId);

			expect(result).toBeNull();
			expect(decryptToken).not.toHaveBeenCalled();
		});

		it('should return null for non-existent user', async () => {
			const mockUserId = 'non-existent';

			vi.mocked(serverRequest).mockResolvedValue({
				users_by_pk: null
			});

			const result = await getGithubToken(mockUserId);

			expect(result).toBeNull();
		});

		it('should handle serverRequest errors gracefully', async () => {
			const mockUserId = 'user-789';

			vi.mocked(serverRequest).mockRejectedValue(new Error('Database error'));

			const result = await getGithubToken(mockUserId);

			expect(result).toBeNull();
		});

		it('should handle decryption errors gracefully', async () => {
			const mockUserId = 'user-999';

			vi.mocked(serverRequest).mockResolvedValue({
				users_by_pk: {
					id: mockUserId,
					settings: {
						tokens: {
							github: {
								encrypted: 'invalid:format'
							}
						}
					}
				}
			});

			vi.mocked(decryptToken).mockImplementation(() => {
				throw new Error('Decryption failed');
			});

			const result = await getGithubToken(mockUserId);

			expect(result).toBeNull();
		});
	});

	describe('githubRequest', () => {
		const mockToken = 'gho_testtoken123';

		beforeEach(() => {
			global.fetch = vi.fn();
		});

		it('should make successful GET request to GitHub API', async () => {
			const mockResponse = { id: 1, name: 'test-repo' };

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			} as Response);

			const result = await githubRequest('/repos/owner/repo', mockToken);

			expect(fetch).toHaveBeenCalledWith(
				'https://api.github.com/repos/owner/repo',
				{
					headers: {
						Authorization: `token ${mockToken}`,
						Accept: 'application/vnd.github.v3+json'
					}
				}
			);
			expect(result).toEqual(mockResponse);
		});

		it('should make successful POST request with body', async () => {
			const mockPayload = { title: 'Test Issue', body: 'Description' };
			const mockResponse = { id: 42, number: 1 };

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			} as Response);

			const result = await githubRequest('/repos/owner/repo/issues', mockToken, {
				method: 'POST',
				body: JSON.stringify(mockPayload)
			});

			expect(fetch).toHaveBeenCalledWith(
				'https://api.github.com/repos/owner/repo/issues',
				{
					method: 'POST',
					body: JSON.stringify(mockPayload),
					headers: {
						Authorization: `token ${mockToken}`,
						Accept: 'application/vnd.github.v3+json'
					}
				}
			);
			expect(result).toEqual(mockResponse);
		});

		it('should handle full GitHub URLs', async () => {
			const mockResponse = { id: 1 };

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			} as Response);

			await githubRequest('https://api.github.com/user', mockToken);

			expect(fetch).toHaveBeenCalledWith(
				'https://api.github.com/user',
				expect.any(Object)
			);
		});

		it('should preserve custom headers', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({})
			} as Response);

			await githubRequest('/repos/owner/repo', mockToken, {
				headers: {
					'X-Custom-Header': 'value',
					'Content-Type': 'application/json'
				}
			});

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: {
						Authorization: `token ${mockToken}`,
						Accept: 'application/vnd.github.v3+json',
						'X-Custom-Header': 'value',
						'Content-Type': 'application/json'
					}
				})
			);
		});

		it('should throw error for 401 Unauthorized', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 401,
				text: async () => 'Bad credentials'
			} as Response);

			await expect(
				githubRequest('/repos/owner/repo', 'invalid-token')
			).rejects.toThrow('GitHub API error (401): Bad credentials');
		});

		it('should throw error for 403 Forbidden', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 403,
				text: async () => 'API rate limit exceeded'
			} as Response);

			await expect(
				githubRequest('/repos/owner/repo', mockToken)
			).rejects.toThrow('GitHub API error (403): API rate limit exceeded');
		});

		it('should throw error for 404 Not Found', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 404,
				text: async () => 'Not Found'
			} as Response);

			await expect(
				githubRequest('/repos/owner/nonexistent', mockToken)
			).rejects.toThrow('GitHub API error (404): Not Found');
		});

		it('should throw error for 422 Unprocessable Entity', async () => {
			const errorResponse = JSON.stringify({
				message: 'Validation Failed',
				errors: [{ field: 'title', code: 'missing_field' }]
			});

			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 422,
				text: async () => errorResponse
			} as Response);

			await expect(
				githubRequest('/repos/owner/repo/issues', mockToken, {
					method: 'POST',
					body: '{}'
				})
			).rejects.toThrow('GitHub API error (422)');
		});

		it('should throw error for 500 Internal Server Error', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 500,
				text: async () => 'Internal Server Error'
			} as Response);

			await expect(
				githubRequest('/repos/owner/repo', mockToken)
			).rejects.toThrow('GitHub API error (500): Internal Server Error');
		});

		it('should handle network errors', async () => {
			vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

			await expect(
				githubRequest('/repos/owner/repo', mockToken)
			).rejects.toThrow('Network error');
		});
	});
});
