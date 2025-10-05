/** @file src/lib/test-utils/github-mocks.ts */
import crypto from 'crypto';

/**
 * Mock GitHub API responses for testing
 */

export interface MockGithubIssueOptions {
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

export function mockGithubIssue(overrides: MockGithubIssueOptions = {}) {
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

export interface MockGithubCommentOptions {
	id?: number;
	body?: string;
	user?: { login: string };
	html_url?: string;
	created_at?: string;
	updated_at?: string;
}

export function mockGithubComment(overrides: MockGithubCommentOptions = {}) {
	const defaults = {
		id: 789,
		body: 'Test comment',
		user: { login: 'testuser' },
		html_url: 'https://github.com/owner/repo/issues/42#issuecomment-789',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};

	return { ...defaults, ...overrides };
}

export interface MockGithubRepoOptions {
	full_name?: string;
	name?: string;
	owner?: { login: string };
	description?: string | null;
	private?: boolean;
	html_url?: string;
}

export function mockGithubRepo(overrides: MockGithubRepoOptions = {}) {
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

export interface MockGithubWebhookOptions {
	id?: number;
	url?: string;
	test_url?: string;
	ping_url?: string;
	active?: boolean;
	events?: string[];
	config?: {
		url?: string;
		content_type?: string;
		insecure_ssl?: string;
	};
	created_at?: string;
	updated_at?: string;
}

export function mockGithubWebhook(overrides: MockGithubWebhookOptions = {}) {
	const defaults = {
		id: 12345,
		url: 'https://api.github.com/repos/owner/repo/hooks/12345',
		test_url: 'https://api.github.com/repos/owner/repo/hooks/12345/test',
		ping_url: 'https://api.github.com/repos/owner/repo/hooks/12345/pings',
		active: true,
		events: ['issues', 'issue_comment'],
		config: {
			url: 'https://app.example.com/api/github/webhook',
			content_type: 'json',
			insecure_ssl: '0'
		},
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
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
 * Generate mock GitHub personal access token
 */
export function mockGithubToken(): string {
	return 'gho_' + crypto.randomBytes(20).toString('hex');
}

/**
 * Generate mock encrypted token string (iv:encrypted format)
 */
export function mockEncryptedToken(): string {
	const iv = crypto.randomBytes(16).toString('hex');
	const encrypted = crypto.randomBytes(32).toString('hex');
	return `${iv}:${encrypted}`;
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

/**
 * Mock GitHub comment event for webhooks
 */
export interface MockCommentEventOptions {
	action?: 'created' | 'edited' | 'deleted';
	comment?: Partial<ReturnType<typeof mockGithubComment>>;
	issue?: { id: number; number: number };
	repository?: Partial<ReturnType<typeof mockGithubRepo>>;
}

export function mockGithubCommentEvent(overrides: MockCommentEventOptions = {}) {
	const defaults = {
		action: 'created' as const,
		comment: mockGithubComment(),
		issue: { id: 123456, number: 42 },
		repository: mockGithubRepo()
	};

	return { ...defaults, ...overrides };
}

/**
 * Mock GitHub user
 */
export interface MockGithubUserOptions {
	login?: string;
	id?: number;
	avatar_url?: string;
	type?: 'User' | 'Organization';
}

export function mockGithubUser(overrides: MockGithubUserOptions = {}) {
	const defaults = {
		login: 'testuser',
		id: 12345,
		avatar_url: 'https://avatars.githubusercontent.com/u/12345',
		type: 'User' as const
	};

	return { ...defaults, ...overrides };
}

/**
 * Mock GitHub label
 */
export interface MockGithubLabelOptions {
	name?: string;
	color?: string;
	description?: string;
}

export function mockGithubLabel(overrides: MockGithubLabelOptions = {}) {
	const defaults = {
		name: 'bug',
		color: 'd73a4a',
		description: 'Something isn\'t working'
	};

	return { ...defaults, ...overrides };
}

/**
 * Helper to create priority labels
 */
export function mockPriorityLabels() {
	return {
		high: mockGithubLabel({ name: 'priority: high', color: 'd73a4a' }),
		medium: mockGithubLabel({ name: 'priority: medium', color: 'fbca04' }),
		low: mockGithubLabel({ name: 'priority: low', color: '0e8a16' })
	};
}

/**
 * Mock GitHub API error response
 */
export interface MockGithubErrorOptions {
	status?: number;
	message?: string;
	errors?: Array<{ field: string; code: string; message?: string }>;
}

export function mockGithubError(overrides: MockGithubErrorOptions = {}) {
	const defaults = {
		status: 422,
		message: 'Validation Failed',
		errors: [{ field: 'title', code: 'missing_field' }]
	};

	return { ...defaults, ...overrides };
}

/**
 * Helper to create a mock fetch response
 */
export function mockFetchResponse(data: any, status = 200, ok = true) {
	return Promise.resolve({
		ok,
		status,
		json: async () => data,
		text: async () => JSON.stringify(data),
		headers: new Headers({
			'content-type': 'application/json'
		})
	} as Response);
}

/**
 * Helper to create a mock fetch error
 */
export function mockFetchError(message: string) {
	return Promise.reject(new Error(message));
}
