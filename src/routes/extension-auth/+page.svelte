<script lang="ts">
	/** @file src/routes/extension-auth/+page.svelte */
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let status = $state('checking');
	let message = $state('Checking authentication...');
	let token = $state<string | null>(null);

	onMount(async () => {
		try {
			// Fetch JWT token from the API
			const response = await fetch('/api/auth/token');

			if (!response.ok) {
				status = 'error';
				message = 'Not authenticated. Please sign in first.';

				// Redirect to sign-in after 2 seconds
				setTimeout(() => {
					window.location.href = '/signin?redirect=/extension-auth';
				}, 2000);
				return;
			}

			const data = await response.json();

			if (!data.token) {
				status = 'error';
				message = 'Failed to get authentication token.';
				return;
			}

			token = data.token;
			status = 'success';
			message = 'Authentication successful! You can now close this tab and return to the extension.';

			// Store token in localStorage so extension can access it
			localStorage.setItem('todzz_extension_token', data.token);
			localStorage.setItem('todzz_extension_token_time', Date.now().toString());

			// Also send message to any listening extension
			if (window.opener) {
				window.opener.postMessage(
					{
						type: 'TODZZ_AUTH_SUCCESS',
						token: data.token
					},
					'*'
				);
			}

			// Auto-close after 3 seconds
			setTimeout(() => {
				window.close();
			}, 3000);
		} catch (error) {
			console.error('Extension auth error:', error);
			status = 'error';
			message = error instanceof Error ? error.message : 'An error occurred';
		}
	});
</script>

<div class="container">
	<div class="card">
		<div class="icon">
			{#if status === 'checking'}
				<div class="spinner"></div>
			{:else if status === 'success'}
				✓
			{:else}
				✗
			{/if}
		</div>

		<h1 class="title">ToDzz Extension</h1>

		<p class="message" class:success={status === 'success'} class:error={status === 'error'}>
			{message}
		</p>

		{#if status === 'success' && token}
			<div class="instructions">
				<p><strong>Next steps:</strong></p>
				<ol>
					<li>Return to the extension popup</li>
					<li>Click the refresh/reload icon if needed</li>
					<li>Your boards should now be visible</li>
				</ol>
			</div>

			<div class="token-info">
				<p class="token-label">Token (for debugging):</p>
				<code class="token">{token.substring(0, 30)}...</code>
			</div>
		{/if}

		{#if status === 'error'}
			<div class="actions">
				<a href="/signin?redirect=/extension-auth" class="btn">Sign In</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 40px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		text-align: center;
	}

	.icon {
		font-size: 64px;
		margin-bottom: 20px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 60px;
		height: 60px;
		border: 6px solid #e5e7eb;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.title {
		font-size: 28px;
		font-weight: 700;
		color: #111827;
		margin-bottom: 16px;
	}

	.message {
		font-size: 16px;
		color: #6b7280;
		margin-bottom: 24px;
		line-height: 1.6;
	}

	.message.success {
		color: #059669;
	}

	.message.error {
		color: #dc2626;
	}

	.instructions {
		background: #f3f4f6;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
		text-align: left;
	}

	.instructions p {
		font-weight: 600;
		margin-bottom: 12px;
		color: #374151;
	}

	.instructions ol {
		margin-left: 20px;
		color: #6b7280;
	}

	.instructions li {
		margin-bottom: 8px;
	}

	.token-info {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 12px;
		margin-top: 20px;
	}

	.token-label {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 6px;
		text-align: left;
	}

	.token {
		display: block;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		color: #111827;
		background: white;
		padding: 8px;
		border-radius: 4px;
		overflow-x: auto;
		text-align: left;
	}

	.actions {
		margin-top: 24px;
	}

	.btn {
		display: inline-block;
		padding: 12px 24px;
		background: #667eea;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 500;
		transition: background 0.2s;
	}

	.btn:hover {
		background: #5568d3;
	}
</style>
