<!-- @file src/routes/workflow/+page.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Mic,
		Puzzle,
		NotebookPen,
		FileText,
		ListChecks,
		Bot,
		BellRing,
		GitCommitHorizontal,
		Github,
		ArrowLeft
	} from 'lucide-svelte';

	const capture = [
		{
			icon: Mic,
			title: 'Voice',
			description:
				'Dictate a card straight into Backlog from your phone browser. No app to install, no keyboard, no laptop.'
		},
		{
			icon: Puzzle,
			title: 'Browser extension',
			description:
				'The ToDzz Chrome extension saves any web page to a board as a note, with an AI summary and the images you pick.'
		},
		{
			icon: NotebookPen,
			title: 'AI notes',
			description:
				'Dictate a note and AI cleans it up, or turn on research mode to have it dig into the topic before you decide anything.'
		}
	];

	const loop = [
		{
			icon: FileText,
			title: 'The card becomes a task file',
			description:
				'Creating a card writes doc/todo/NNN-slug.md into the GitHub repo connected to the board, and opens a matching issue. Your original words stay at the top of that file forever.'
		},
		{
			icon: ListChecks,
			title: 'A plan pass sharpens it',
			description:
				'A raw voice dump is not a task. The /plan command rewrites it into a real one: a requirement section, which model and effort to run it with, and a scope that fits a single session.'
		},
		{
			icon: Bot,
			title: 'Moving it to TODO runs it',
			description:
				'Drag the card to TODO and the file is renamed -TODO.md. A small daemon on your own machine notices, and starts Claude Code on it — one card at a time, in a terminal session you can attach to and watch.'
		},
		{
			icon: BellRing,
			title: 'Your phone stays in the loop',
			description:
				'You get a push when the agent finishes or fails, and a ping when it stops to ask something — which you can answer from the phone instead of walking back to the desk.'
		},
		{
			icon: GitCommitHorizontal,
			title: 'The results come back to the board',
			description:
				'The agent writes down what it built, commits and pushes. The card moves itself to Review — or Blocked, if it needs you — and the outcome is posted as a comment.'
		}
	];

	const requirements = [
		[
			'A board connected to GitHub',
			'Cards and issues sync both ways, so the repo is the hand-off point.'
		],
		[
			'Claude Code on your machine',
			'Plus the dev-kit plugin that adds /plan, /todo, /verify and /security-review.'
		],
		[
			'The runner daemon',
			'Watches your local clone and starts the agent at the model and effort the task file asks for.'
		]
	];
</script>

<svelte:head>
	<title>Agentic Development — ToDzz</title>
	<meta
		name="description"
		content="Dictate a card on your phone and an AI agent writes the code on your machine, then moves the card to Review. How the ToDzz agentic development loop works."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-background to-muted/20">
	<!-- Hero -->
	<header class="container mx-auto px-4 py-16 md:py-24">
		<div class="mx-auto max-w-4xl text-center">
			<a
				href="https://todzz.eu/"
				class="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline"
			>
				<ArrowLeft class="h-4 w-4" /> Back to ToDzz
			</a>
			<h1 class="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
				<span class="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
					Your board writes the code
				</span>
			</h1>
			<p class="mb-8 text-xl text-muted-foreground md:text-2xl">
				From a voice note on the bus to a pushed commit
			</p>
			<p class="mb-12 text-lg text-muted-foreground">
				Most boards track work that someone else has to do. Say what you want into a ToDzz card, and
				an AI agent picks it up on your own machine, writes the code, and moves the card to Review
				with the results attached.
			</p>
			<Button href="/signin" size="lg" class="text-lg">Try it free</Button>
		</div>
	</header>

	<!-- Capture -->
	<section class="container mx-auto px-4 py-16">
		<h2 class="mb-4 text-center text-3xl font-bold md:text-4xl">Capture it anywhere</h2>
		<p class="mb-12 text-center text-lg text-muted-foreground">
			The idea arrives when you are nowhere near an editor. That is the point.
		</p>
		<div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
			{#each capture as item (item.title)}
				<div class="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
						<item.icon class="h-6 w-6 text-primary" />
					</div>
					<h3 class="mb-2 text-xl font-semibold">{item.title}</h3>
					<p class="text-muted-foreground">{item.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- The loop -->
	<section class="bg-muted/30 py-16">
		<div class="container mx-auto px-4">
			<h2 class="mb-4 text-center text-3xl font-bold md:text-4xl">What happens next</h2>
			<p class="mb-12 text-center text-lg text-muted-foreground">
				Five steps, and you are only present for the first one.
			</p>
			<div class="mx-auto max-w-4xl space-y-8">
				{#each loop as step, i (step.title)}
					<div class="flex gap-4">
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
						>
							{i + 1}
						</div>
						<div>
							<h3 class="mb-2 flex items-center gap-2 text-xl font-semibold">
								<step.icon class="h-5 w-5 text-primary" />
								{step.title}
							</h3>
							<p class="text-muted-foreground">{step.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- What it takes -->
	<section class="container mx-auto px-4 py-16">
		<h2 class="mb-4 text-center text-3xl font-bold md:text-4xl">What you need</h2>
		<p class="mb-12 text-center text-lg text-muted-foreground">
			The agent runs on your machine, on your code, with your API key. Nothing is sent to us.
		</p>
		<div class="mx-auto max-w-4xl divide-y rounded-lg border bg-card shadow-sm">
			{#each requirements as [name, description] (name)}
				<div class="flex flex-col gap-1 p-6 sm:flex-row sm:gap-6">
					<div class="w-64 flex-shrink-0 font-semibold">{name}</div>
					<p class="text-muted-foreground">{description}</p>
				</div>
			{/each}
		</div>
		<div class="mt-8 text-center">
			<Button
				href="https://github.com/kasparpalgi/klarity-claude-kit/blob/main/plugins/dev-kit/runner/README.md"
				variant="outline"
				size="lg"
				class="text-lg"
			>
				<Github class="mr-2 h-5 w-5" />
				Set it up from GitHub
			</Button>
		</div>
	</section>

	<!-- CTA -->
	<section class="container mx-auto px-4 py-16">
		<div
			class="mx-auto max-w-3xl rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 p-12 text-center shadow-lg"
		>
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">Stop typing tickets</h2>
			<p class="mb-8 text-lg text-muted-foreground">
				Start telling your board what you want, and read the diff later.
			</p>
			<Button href="/signin" size="lg" class="text-lg">Start Free Today</Button>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t bg-muted/30 py-8">
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			<a href="https://todzz.eu/" class="hover:text-primary hover:underline">Back to ToDzz</a>
		</div>
	</footer>
</div>
