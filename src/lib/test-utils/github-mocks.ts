/** @file src/lib/test-utils/github-mocks.ts */
import crypto from 'crypto';

/**
 * Mock GitHub API responses for testing
 */

interface MockGithubIssueOptions {
	id?: number;
	number?: number;
	title?: string;
	body?: string;
	state?: 'open' | 'closed';
	labels?: Array<{ name: string; color: string }>;
	assignees?: Array<{ login: string }>;
	milestone?: { title: string; due_on: string } | null;
	closed_at?: string | null;
	html_url?: string;
	user?: { login: string };
	created_at?: string;
	updated_at?: string;
	pull_request?: any;
}

function mockGithubIssue(overrides: MockGithubIssueOptions = {}) {
	const defaults = {
		id: 123456,
		number: 42,
		title: 'Test Issue',
		body: 'This is a test issue',
		state: 'open' as const,
		labels: [],
		assignees: [],
		milestone: null,
		closed_at: null,
		html_url: 'https://github.com/owner/repo/issues/42',
		user: { login: 'testuser' },
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		pull_request: undefined
	};

	return { ...defaults, ...overrides };
}

interface MockGithubRepoOptions {
	full_name?: string;
	name?: string;
	owner?: { login: string };
	description?: string | null;
	private?: boolean;
	html_url?: string;
}

function mockGithubRepo(overrides: MockGithubRepoOptions = {}) {
	const defaults = {
		full_name: 'owner/repo',
		name: 'repo',
		owner: { login: 'owner' },
		description: 'Test repository',
		private: false,
		html_url: 'https://github.com/owner/repo'
	};

	return { ...defaults, ...overrides };
}

/**
 * Generate HMAC SHA-256 signature for webhook payload
 */
export function mockWebhookSignature(payload: string, secret: string): string {
	const hmac = crypto.createHmac('sha256', secret);
	return 'sha256=' + hmac.update(payload).digest('hex');
}

/**
 * Mock GitHub issue event for webhooks
 */
export interface MockIssueEventOptions {
	action?: 'opened' | 'edited' | 'closed' | 'reopened' | 'deleted';
	issue?: Partial<ReturnType<typeof mockGithubIssue>>;
	repository?: Partial<ReturnType<typeof mockGithubRepo>>;
}

export function mockGithubIssueEvent(overrides: MockIssueEventOptions = {}) {
	const defaults = {
		action: 'opened' as const,
		issue: mockGithubIssue(),
		repository: mockGithubRepo()
	};

	return { ...defaults, ...overrides };
}
