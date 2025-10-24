<!-- @file src/routes/+page.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle2, Github, Calendar, Users, FileText, Zap, Shield } from 'lucide-svelte';

	const features = [
		{
			icon: Zap,
			title: 'Fast & Simple',
			description: 'Modern, intuitive interface that is easy to use and lightning fast'
		},
		{
			icon: Github,
			title: 'GitHub Integration',
			description: 'Seamlessly sync with GitHub issues and keep developers and clients in sync'
		},
		{
			icon: Users,
			title: 'Multi-User Collaboration',
			description: 'Invite team members with different permissions and work together'
		},
		{
			icon: Calendar,
			title: 'Rich Task Management',
			description: 'Priorities, due dates, labels, file uploads, and rich text editing'
		},
		{
			icon: FileText,
			title: 'Kanban & List Views',
			description: 'Organize tasks visually with drag-and-drop or in classic list view'
		},
		{
			icon: Shield,
			title: 'Open Source & Secure',
			description: 'Fully auditable code, privacy-first design, and Google OAuth login'
		}
	];

	const techStack = [
		{ name: 'Svelte 5', description: 'Best-in-class performance with smaller bundle sizes' },
		{
			name: 'Hasura',
			description: 'GraphQL API that makes backend development 10x faster'
		},
		{ name: 'Auth.js', description: 'Secure authentication with JWT tokens' },
		{ name: 'PostgreSQL', description: 'Rock-solid database foundation' }
	];

	const pricingOptions = [
		{
			title: 'Free SaaS',
			price: 'Free Forever',
			description: 'For early adopters',
			features: [
				'Unlimited boards',
				'GitHub integration',
				'Multi-user collaboration',
				'All features included'
			]
		},
		{
			title: 'Self-Hosted',
			price: '€3/month',
			description: 'Hosted in your Hetzner server',
			features: ['Full control', 'Software updates', 'Health checks', 'Unlimited users']
		},
		{
			title: 'Setup Service',
			price: '€100',
			description: 'One-time setup fee',
			features: [
				'Installed in your server',
				'Complete configuration',
				'Free hosting (~€3.50/month)',
				'Ready to use'
			]
		},
		{
			title: 'White Label',
			price: '€200',
			description: 'One-time branding fee',
			features: ['Your company colors', 'Your branding', 'Custom domain', 'Full setup included']
		}
	];
</script>

<svelte:head>
	<title>ToDzz - Open-Source Kanban Board for Modern Teams</title>
	<meta
		name="description"
		content="Simple, fast, and free Kanban board with GitHub integration. Perfect for teams who need something between GitHub and expensive project management tools."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<!-- Hero Section -->
	<header class="container mx-auto px-4 py-16 md:py-24">
		<div class="mx-auto max-w-4xl text-center">
			<h1 class="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
				<span class="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
					ToDzz
				</span>
			</h1>
			<p class="mb-8 text-xl text-muted-foreground md:text-2xl">
				Open-Source Free Kanban Todo Lists
			</p>
			<p class="mb-12 text-lg text-muted-foreground md:text-xl">
				Because developers love GitHub, but clients don't. Trello's pricey. Jira's bonkers. <br />
				Here's something that actually makes sense.
			</p>
			<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
				<Button href="/signin" size="lg" class="text-lg">Get Started Free</Button>
				<Button
					href="https://github.com/kasparpalgi/svelte-todo-kanban"
					variant="outline"
					size="lg"
					class="text-lg"
				>
					<Github class="mr-2 h-5 w-5" />
					View on GitHub
				</Button>
			</div>
		</div>
	</header>

	<!-- Problem Statement -->
	<section class="container mx-auto px-4 py-16">
		<div class="mx-auto max-w-3xl rounded-lg border bg-card p-8 text-center shadow-lg">
			<h2 class="mb-4 text-2xl font-semibold md:text-3xl">GitHub-Integrated Task Management</h2>
			<p class="text-lg text-muted-foreground">
				A clean, intuitive Kanban board that syncs seamlessly with GitHub issues while providing a
				friendly interface that clients actually enjoy using. Best of both worlds.
			</p>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="container mx-auto px-4 py-16">
		<h2 class="mb-12 text-center text-3xl font-bold md:text-4xl">Why Choose ToDzz?</h2>
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature}
				<div class="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<svelte:component this={feature.icon} class="h-6 w-6 text-primary" />
					</div>
					<h3 class="mb-2 text-xl font-semibold">{feature.title}</h3>
					<p class="text-muted-foreground">{feature.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- How It Works -->
	<section class="container mx-auto px-4 py-16">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-12 text-center text-3xl font-bold md:text-4xl">How It Works</h2>
			<div class="space-y-8">
				<div class="flex gap-4">
					<div
						class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
					>
						1
					</div>
					<div>
						<h3 class="mb-2 text-xl font-semibold">Create Boards</h3>
						<p class="text-muted-foreground">
							Create as many boards as you need for different projects or sub-projects. Organize
							your work your way.
						</p>
					</div>
				</div>
				<div class="flex gap-4">
					<div
						class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
					>
						2
					</div>
					<div>
						<h3 class="mb-2 text-xl font-semibold">Add Columns</h3>
						<p class="text-muted-foreground">
							Create columns like Backlog, Todo, Doing, Review, or customize them to fit your
							workflow. Tasks flow from left to right.
						</p>
					</div>
				</div>
				<div class="flex gap-4">
					<div
						class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
					>
						3
					</div>
					<div>
						<h3 class="mb-2 text-xl font-semibold">Manage Tasks</h3>
						<p class="text-muted-foreground">
							Create rich tasks with titles, descriptions, images, files, priorities, labels, and
							due dates. Everything syncs with GitHub.
						</p>
					</div>
				</div>
				<div class="flex gap-4">
					<div
						class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
					>
						4
					</div>
					<div>
						<h3 class="mb-2 text-xl font-semibold">Collaborate</h3>
						<p class="text-muted-foreground">
							Invite team members, import existing GitHub issues, and keep everyone in sync with
							automatic updates.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- All Features -->
	<section class="bg-muted/30 py-16">
		<div class="container mx-auto px-4">
			<h2 class="mb-12 text-center text-3xl font-bold md:text-4xl">All Features</h2>
			<div class="mx-auto max-w-4xl">
				<div class="grid gap-4 md:grid-cols-2">
					{#each ['Kanban and list view', 'Multilingual support', 'Drag & drop tasks', 'Fully integrated with GitHub', 'PWA mobile app', 'Time tracking & estimates', 'Voice + AI note taking', 'Google Calendar integration', 'Multi-user collaboration', 'Comments (synced with GitHub)', 'File uploads', 'Rich text editing', 'Priorities & due dates', 'Keyboard shortcuts', 'Label management', 'Private/public boards', 'Vote for new features', 'Data export'] as feature}
						<div class="flex items-start gap-3">
							<CheckCircle2 class="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
							<span class="text-muted-foreground">{feature}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Tech Stack -->
	<section class="container mx-auto px-4 py-16">
		<h2 class="mb-12 text-center text-3xl font-bold md:text-4xl">Built with Modern Technology</h2>
		<div class="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
			{#each techStack as tech}
				<div class="rounded-lg border bg-card p-6 shadow-sm">
					<h3 class="mb-2 text-xl font-semibold">{tech.name}</h3>
					<p class="text-muted-foreground">{tech.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Pricing -->
	<section class="bg-muted/30 py-16">
		<div class="container mx-auto px-4">
			<h2 class="mb-4 text-center text-3xl font-bold md:text-4xl">Choose Your Path</h2>
			<p class="mb-12 text-center text-lg text-muted-foreground">
				Free forever, or self-host with complete control
			</p>
			<div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
				{#each pricingOptions as option}
					<div class="flex flex-col rounded-lg border bg-card p-6 shadow-sm">
						<h3 class="mb-2 text-2xl font-bold">{option.title}</h3>
						<div class="mb-2 text-3xl font-bold text-primary">{option.price}</div>
						<p class="mb-6 text-sm text-muted-foreground">{option.description}</p>
						<ul class="mb-6 flex-grow space-y-3">
							{#each option.features as feature}
								<li class="flex items-start gap-2">
									<CheckCircle2 class="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
									<span class="text-sm">{feature}</span>
								</li>
							{/each}
						</ul>
						{#if option.title === 'Free SaaS'}
							<Button href="/signup" class="w-full">Get Started</Button>
						{:else}
							<Button href="mailto:hey@todzz.eu" class="w-full">Contact</Button>
						{/if}
					</div>
				{/each}
			</div>
			<p class="mt-8 text-center text-sm text-muted-foreground">
				Need a custom feature? <a href="mailto:hey@todzz.eu" class="text-primary hover:underline"
					>Contact us</a
				> for an estimate.
			</p>
		</div>
	</section>

	<!-- CTA -->
	<section class="container mx-auto px-4 py-16">
		<div
			class="mx-auto max-w-3xl rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 p-12 text-center shadow-lg"
		>
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">Ready to Get Organized?</h2>
			<p class="mb-8 text-lg text-muted-foreground">
				Join teams who've found the perfect balance between simplicity and power.
			</p>
			<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
				<Button href="/signin" size="lg" class="text-lg">Start Free Today</Button>
				<Button
					href="https://github.com/kasparpalgi/svelte-todo-kanban"
					variant="outline"
					size="lg"
					class="text-lg"
				>
					<Github class="mr-2 h-5 w-5" />
					Self-Host on GitHub
				</Button>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t bg-muted/30 py-8">
		<div
			class="container mx-auto flex flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground"
		>
			<p>
				Open source and licensed under MIT. For commercial use, please contact to obtain a
				commercial license.
			</p>
			<div class="flex flex-wrap justify-center gap-x-4 gap-y-2">
				<a href="/terms?privacy" class="hover:text-primary hover:underline">Privacy Conditions</a>
				<a href="/terms?terms" class="hover:text-primary hover:underline">Terms & Conditions</a>
				<a href="mailto:hey@todzz.eu" class="hover:text-primary hover:underline">Contact</a>
			</div>
		</div>
	</footer>
</div>
