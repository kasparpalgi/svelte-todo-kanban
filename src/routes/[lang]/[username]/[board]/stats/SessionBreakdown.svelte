<!-- @file src/routes/[lang]/[username]/[board]/stats/SessionBreakdown.svelte -->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { SessionBreakdown } from '$lib/stores/trackerStats.svelte';
	import { ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-svelte';

	interface Props {
		sessions: SessionBreakdown[];
		title?: string;
	}

	let { sessions = [], title = 'Session Breakdown' }: Props = $props();

	let expandedSessions = $state(new Set<number>());
	let searchQuery = $state('');
	let currentPage = $state(1);
	const itemsPerPage = 25;

	let filteredSessions = $derived(
		sessions.filter(
			(s) =>
				s.windowTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.reason.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let totalPages = $derived(Math.ceil(filteredSessions.length / itemsPerPage));

	let paginatedSessions = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredSessions.slice(startIndex, endIndex);
	});

	function handleSearch() {
		// Reset to first page when searching
		currentPage = 1;
	}

	function toggleSession(sessionId: number) {
		if (expandedSessions.has(sessionId)) {
			expandedSessions.delete(sessionId);
		} else {
			expandedSessions.add(sessionId);
		}
		expandedSessions = expandedSessions; // Trigger reactivity
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatSeconds(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		}
		if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	}

	function getMatchTypeColor(matchType: string): string {
		switch (matchType) {
			case 'project':
				return 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700';
			case 'category':
				return 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700';
			case 'unmatched':
				return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700';
			default:
				return 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700';
		}
	}

	function getMatchTypeLabel(matchType: string): string {
		switch (matchType) {
			case 'project':
				return 'Project Match';
			case 'category':
				return 'Category Match';
			case 'unmatched':
				return 'Unmatched';
			default:
				return 'Unknown';
		}
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>{title}</CardTitle>
		<CardDescription>
			{$t('stats.sessionBreakdownDesc', 'Detailed view of all tracked sessions and their allocations')}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<!-- Search box -->
		<div class="space-y-2">
			<label for="session-search" class="text-sm font-medium">
				{$t('stats.searchSessions', 'Search Sessions')}
			</label>
			<Input
				id="session-search"
				type="text"
				placeholder={$t('stats.searchPlaceholder', 'Search by window title or reason...')}
				bind:value={searchQuery}
				onchange={handleSearch}
				oninput={handleSearch}
				class="w-full"
			/>
		</div>

		<!-- Summary stats -->
		<div class="grid grid-cols-3 gap-4 rounded-lg bg-slate-100 dark:bg-slate-900 p-4">
			<div class="text-center">
				<p class="text-xs text-muted-foreground">{$t('stats.totalSessions', 'Total Sessions')}</p>
				<p class="text-lg font-bold">{sessions.length}</p>
			</div>
			<div class="text-center">
				<p class="text-xs text-muted-foreground">{$t('stats.matched', 'Matched')}</p>
				<p class="text-lg font-bold text-blue-600 dark:text-blue-400">
					{sessions.filter((s) => s.matchType !== 'unmatched').length}
				</p>
			</div>
			<div class="text-center">
				<p class="text-xs text-muted-foreground">{$t('stats.unmatched', 'Unmatched')}</p>
				<p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
					{sessions.filter((s) => s.matchType === 'unmatched').length}
				</p>
			</div>
		</div>

		<!-- Pagination info -->
		{#if filteredSessions.length > 0}
			<div class="flex items-center justify-between text-sm text-muted-foreground">
				<p>
					Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} sessions
				</p>
				<p class="font-medium">Page {currentPage} of {totalPages}</p>
			</div>
		{/if}

		<!-- Sessions list -->
		<div class="space-y-2">
			{#if filteredSessions.length === 0}
				<div class="flex items-center justify-center gap-2 py-8 text-muted-foreground">
					<AlertCircle class="w-4 h-4" />
					<p>{$t('stats.noSessionsFound', 'No sessions found matching your search.')}</p>
				</div>
			{:else}
				{#each paginatedSessions as session (session.sessionId)}
					<div class="border rounded-lg border-slate-200 dark:border-slate-700 overflow-hidden">
						<!-- Header (always visible) -->
						<button
							onclick={() => toggleSession(session.sessionId)}
							class="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
						>
							<div class="flex-1 text-left min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span
										class={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getMatchTypeColor(session.matchType)}`}
									>
										{getMatchTypeLabel(session.matchType)}
									</span>
									{#if session.allocatedToProject}
										<span class="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700">
											→ {session.allocatedToProject}
										</span>
									{:else if session.allocatedToCategory}
										<span class="px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border border-green-300 dark:border-green-700">
											→ {session.allocatedToCategory}
										</span>
									{/if}
									<span class="text-xs text-muted-foreground">{formatDate(session.startTime)}</span>
								</div>
								<p class="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
									{session.windowTitle}
								</p>
								<p class="text-xs text-muted-foreground">
									{formatSeconds(session.durationSeconds)}
								</p>
							</div>
							<div class="ml-2 flex-shrink-0">
								{#if expandedSessions.has(session.sessionId)}
									<ChevronUp class="w-4 h-4 text-muted-foreground" />
								{:else}
									<ChevronDown class="w-4 h-4 text-muted-foreground" />
								{/if}
							</div>
						</button>

						<!-- Expanded details -->
						{#if expandedSessions.has(session.sessionId)}
							<div class="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 p-3 space-y-3">
								<!-- Match details -->
								<div class="space-y-2">
									<p class="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
										Match Details
									</p>
									{#if session.matchType === 'project' && session.projectName}
										<div class="text-sm">
											<span class="text-muted-foreground">Project:</span>
											<span class="font-medium text-slate-900 dark:text-slate-100">{session.projectName}</span>
										</div>
									{:else if session.matchType === 'category' && session.categoryName}
										<div class="text-sm">
											<span class="text-muted-foreground">Category:</span>
											<span class="font-medium text-slate-900 dark:text-slate-100">{session.categoryName}</span>
										</div>
									{:else}
										<div class="text-sm text-muted-foreground">
											No keyword match found
										</div>
									{/if}
								</div>

								<!-- Reason -->
								<div class="space-y-2">
									<p class="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
										Reason
									</p>
									<p class="text-sm text-slate-700 dark:text-slate-300 italic">"{session.reason}"</p>
								</div>

								<!-- Time details -->
								<div class="space-y-2">
									<p class="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
										Time Details
									</p>
									<div class="grid grid-cols-2 gap-2 text-sm">
										<div>
											<span class="text-muted-foreground">Start:</span>
											<span class="font-medium text-slate-900 dark:text-slate-100">
												{formatDate(session.startTime)}
											</span>
										</div>
										<div>
											<span class="text-muted-foreground">Duration:</span>
											<span class="font-medium text-slate-900 dark:text-slate-100">
												{formatSeconds(session.durationSeconds)}
											</span>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Pagination controls -->
		{#if filteredSessions.length > itemsPerPage}
			<div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
				<button
					disabled={currentPage === 1}
					onclick={() => (currentPage = currentPage - 1)}
					class="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800 transition-colors"
				>
					← Previous
				</button>

				<div class="flex items-center gap-2">
					{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
						<button
							onclick={() => (currentPage = page)}
							class="px-3 py-2 text-sm font-medium rounded-lg {currentPage === page
								? 'bg-primary text-primary-foreground'
								: 'border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'} transition-colors"
						>
							{page}
						</button>
					{/each}
				</div>

				<button
					disabled={currentPage === totalPages}
					onclick={() => (currentPage = currentPage + 1)}
					class="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800 transition-colors"
				>
					Next →
				</button>
			</div>
		{/if}

		<!-- Legend -->
		<div class="rounded-lg bg-slate-100 dark:bg-slate-900 p-3 space-y-2">
			<p class="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
				Legend
			</p>
			<div class="grid grid-cols-3 gap-2 text-xs">
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 font-semibold">
						Project
					</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border border-green-300 dark:border-green-700 font-semibold">
						Category
					</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700 font-semibold">
						Unmatched
					</span>
				</div>
			</div>
		</div>
	</CardContent>
</Card>
