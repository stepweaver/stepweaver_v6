<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';

	const positioningStats = [
		{
			label: 'Not volume',
			value: 'Fit first',
			detail: 'Right people, right problem, real passion.'
		},
		{
			label: 'Core craft',
			value: 'Data workflows',
			detail: 'Handoffs, sync, automation, reporting.'
		},
		{
			label: 'Primary path',
			value: 'Hiring',
			detail: 'Consulting is secondary and selective.'
		}
	];
</script>

<svelte:head>
	<title>Services | λstepweaver</title>
	<meta
		name="description"
		content="Selective consulting: custom data workflows, systems discovery, AI-assisted ops tools, and technical cleanup for teams where the fit is right."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-12 px-4 py-16 pt-24 sm:px-6">
	<header>
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// SERVICES</p>

		<h1 class="text-text mb-4 text-3xl sm:text-5xl">Selective consulting for the right fit</h1>

		<div class="text-secondary max-w-3xl space-y-3 text-sm sm:text-base">
			<p>
				Hiring is the primary path. I also build custom data workflows and ops systems when I meet
				the right people, we vibe, and there is a need I can get passionate about.
			</p>

			<p>
				This is not an agency menu and not volume consulting. I'm just passionate about building
				systems and tools that help people work smarter.
			</p>
		</div>

		<div class="mt-6 flex flex-wrap gap-3">
			<ActionLink href="/contact?intent=consult" label="Start a Conversation" variant="primary" />

			<ActionLink href="/work" label="See Proof" />

			<ActionLink href="/about" label="About" />
		</div>
	</header>

	<div class="border-border/20 bg-border/15 grid grid-cols-1 gap-px border sm:grid-cols-3">
		{#each positioningStats as stat (stat.label)}
			<div class="bg-panel p-6">
				<div class="font-ibm text-neon mb-1 text-lg">
					{stat.value}
				</div>

				<div class="text-label mb-2">
					{stat.label}
				</div>

				<p class="text-secondary text-xs">
					{stat.detail}
				</p>
			</div>
		{/each}
	</div>
</div>
