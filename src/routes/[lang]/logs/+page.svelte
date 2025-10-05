<!-- @file src/routes/[lang]/logs/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { request } from '$lib/graphql/client';
	import { GET_LOGS } from '$lib/graphql/documents';
	import { userStore } from '$lib/stores/user.svelte';
	import { loggingStore } from '$lib/stores/logging.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Download, RefreshCw, Search, Filter, AlertCircle, AlertTriangle, Info, Bug } from 'lucide-svelte';

	let user = $derived(userStore.user);
	let userLoading = $derived(userStore.loading);

	// Filter state
	let filters = $state({
		level: 'all' as 'all' | 'error' | 'warn' | 'info' | 'debug',
		component: '',
		search: '',
		dateFrom: '',
		dateTo: ''
	});

	// Pagination state
	let pagination = $state({
		page: 1,
		pageSize: 50,
		total: 0
	});

	// Data state
	let logs = $state<any[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Fetch logs from database
	async function fetchLogs() {
		if (!user?.id) return;

		loading = true;
		error = null;

		try {
			const where: any = {};

			if (filters.level !== 'all') {
				where.level = { _eq: filters.level };
			}

			if (filters.component) {
				where.component = { _ilike: `%${filters.component}%` };
			}

			if (filters.search) {
				where.message = { _ilike: `%${filters.search}%` };
			}

			if (filters.dateFrom) {
				where.timestamp = { ...where.timestamp, _gte: new Date(filters.dateFrom).toISOString() };
			}
			if (filters.dateTo) {
				where.timestamp = { ...where.timestamp, _lte: new Date(filters.dateTo).toISOString() };
			}

			const offset = (pagination.page - 1) * pagination.pageSize;

			console.log('[LogsPage] Fetching logs with params:', {
				where,
				order_by: [{ timestamp: 'desc' }],
				limit: pagination.pageSize,
				offset,
				user_id: user?.id
			});

			const data = await request(GET_LOGS, {
				where,
				order_by: [{ timestamp: 'desc' }],
				limit: pagination.pageSize,
				offset
			});

			console.log('[LogsPage] Response data:', data);

			logs = (data as any).logs || [];
			pagination.total = (data as any).logs_aggregate?.aggregate?.count || 0;

			console.log('[LogsPage] Parsed logs:', logs, 'Total:', pagination.total);

			loggingStore.info('LogsPage', 'Logs fetched successfully', {
				count: logs.length,
				total: pagination.total,
				filters
			});
		} catch (err: any) {
			error = err.message || 'Failed to fetch logs';
			loggingStore.error('LogsPage', 'Failed to fetch logs', { error: err });
		} finally {
			loading = false;
		}
	}

	// Export logs to JSON
	function exportLogs() {
		const exportData = {
			exportTime: new Date().toISOString(),
			user: { id: user?.id, email: user?.email },
			filters,
			logs: logs.map((log) => ({
				...log,
				data: log.data ? JSON.parse(log.data) : null
			}))
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);

		loggingStore.info('LogsPage', 'Logs exported', { count: logs.length });
	}

	// Reset filters
	function resetFilters() {
		filters = {
			level: 'all',
			component: '',
			search: '',
			dateFrom: '',
			dateTo: ''
		};
		pagination.page = 1;
		fetchLogs();
	}

	function applyFilters() {
		pagination.page = 1;
		fetchLogs();
	}

	function nextPage() {
		if (pagination.page * pagination.pageSize < pagination.total) {
			pagination.page++;
			fetchLogs();
		}
	}

	function prevPage() {
		if (pagination.page > 1) {
			pagination.page--;
			fetchLogs();
		}
	}

	// Get log level badge variant
	function getLevelBadgeVariant(level: string): 'destructive' | 'secondary' | 'default' | 'outline' {
		switch (level) {
			case 'error':
				return 'destructive';
			case 'warn':
				return 'secondary';
			case 'info':
				return 'default';
			case 'debug':
				return 'outline';
			default:
				return 'outline';
		}
	}

	function getLevelIcon(level: string) {
		switch (level) {
			case 'error':
				return AlertCircle;
			case 'warn':
				return AlertTriangle;
			case 'info':
				return Info;
			case 'debug':
				return Bug;
			default:
				return Info;
		}
	}

	// Format timestamp
	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	// Parse JSON data safely
	function parseData(data: string | null): any {
		if (!data) return null;
		try {
			return JSON.parse(data);
		} catch {
			return null;
		}
	}

	// Wait for user to load, then check authentication
	$effect(() => {
		if (userLoading) return; // Still loading user data

		if (!user?.id) {
			// User is not authenticated, redirect to signin
			goto(`/${page.params.lang}/signin`);
		}
	});

	// Fetch logs when user is available
	onMount(() => {
		if (user?.id) {
			fetchLogs();
		}
	});


	function $t(arg0: string) {
		throw new Error('Function not implemented.');
	}
</script>

<svelte:head>
	<title>Logs - System Monitoring</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-7xl">
	<div class="mb-6">
		<h1 class="text-3xl font-bold mb-2">System Logs</h1>
		<p class="text-muted-foreground">View and filter application logs for debugging and monitoring</p>
	</div>

	<Card class="mb-6">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Filter class="h-5 w-5" />
				{$t('filters.title')}
			</CardTitle>
			<CardDescription>Filter logs by level, component, date, or search term</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
				<!-- Level Filter -->
				<div class="space-y-2">
					<Label for="level">Level</Label>
					<select
						id="level"
						bind:value={filters.level}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="all">All Levels</option>
						<option value="error">Error</option>
						<option value="warn">Warning</option>
						<option value="info">Info</option>
						<option value="debug">Debug</option>
					</select>
				</div>

				<!-- Component Filter -->
				<div class="space-y-2">
					<Label for="component">Component</Label>
					<Input
						id="component"
						type="text"
						placeholder="e.g., UserStore"
						bind:value={filters.component}
					/>
				</div>

				<!-- Date From -->
				<div class="space-y-2">
					<Label for="dateFrom">From Date</Label>
					<Input id="dateFrom" type="datetime-local" bind:value={filters.dateFrom} />
				</div>

				<!-- Date To -->
				<div class="space-y-2">
					<Label for="dateTo">To Date</Label>
					<Input id="dateTo" type="datetime-local" bind:value={filters.dateTo} />
				</div>
			</div>

			<!-- Search -->
			<div class="space-y-2 mb-4">
				<Label for="search">Search Message</Label>
				<div class="relative">
					<Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
					<Input
						id="search"
						type="text"
						placeholder="Search in log messages..."
						class="pl-10"
						bind:value={filters.search}
					/>
				</div>
			</div>

			<!-- Filter Actions -->
			<div class="flex gap-2">
				<Button onclick={applyFilters}>
					<Search class="h-4 w-4 mr-2" />
					Apply Filters
				</Button>
				<Button variant="outline" onclick={resetFilters}>
					<RefreshCw class="h-4 w-4 mr-2" />
					Reset
				</Button>
				<Button variant="outline" onclick={exportLogs} disabled={logs.length === 0}>
					<Download class="h-4 w-4 mr-2" />
					Export ({logs.length})
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Error Display -->
	{#if error}
		<Card class="mb-6 border-destructive">
			<CardContent class="pt-6">
				<div class="flex items-center gap-2 text-destructive">
					<AlertCircle class="h-5 w-5" />
					<span>{error}</span>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Logs Table Card -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Logs</CardTitle>
					<CardDescription>
						Showing {(pagination.page - 1) * pagination.pageSize + 1}-{Math.min(
							pagination.page * pagination.pageSize,
							pagination.total
						)} of {pagination.total} logs
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onclick={fetchLogs} disabled={loading}>
					<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if loading}
				<div class="text-center py-8 text-muted-foreground">Loading logs...</div>
			{:else if logs.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					No logs found. Try adjusting your filters.
				</div>
			{:else}
				<div class="space-y-4">
					{#each logs as log}
						<div class="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
							<div class="flex items-start justify-between gap-4 mb-2">
								<div class="flex items-center gap-2">
									<Badge variant={getLevelBadgeVariant(log.level)} class="uppercase">
										{@const Icon = getLevelIcon(log.level)}
										<Icon class="h-3 w-3 mr-1" />
										{log.level}
									</Badge>
									<span class="font-mono text-sm font-semibold">{log.component}</span>
								</div>
								<span class="text-sm text-muted-foreground whitespace-nowrap">
									{formatTimestamp(log.timestamp)}
								</span>
							</div>

							<p class="text-sm mb-2">{log.message}</p>

							{#if log.data}
								<details class="mt-2">
									<summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
										View data
									</summary>
									<pre class="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">{JSON.stringify(
											parseData(log.data),
											null,
											2
										)}</pre>
								</details>
							{/if}

							<div class="mt-2 flex gap-4 text-xs text-muted-foreground">
								{#if log.url}
									<span class="truncate max-w-xs" title={log.url}>URL: {log.url}</span>
								{/if}
								{#if log.session_id}
									<span class="font-mono">Session: {log.session_id.slice(0, 8)}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				<div class="flex items-center justify-between mt-6 pt-4 border-t">
					<div class="text-sm text-muted-foreground">
						Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
					</div>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={prevPage}
							disabled={pagination.page === 1}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={nextPage}
							disabled={pagination.page * pagination.pageSize >= pagination.total}
						>
							Next
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
