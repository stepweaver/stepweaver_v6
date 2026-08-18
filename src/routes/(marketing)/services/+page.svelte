<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
</script>

<svelte:head>
	<title>Services | λstepweaver</title>
	<meta
		name="description"
		content="Selective consulting: custom data workflows, systems discovery, AI-assisted ops tools, and technical cleanup for teams where the fit is right."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-16 pt-24 sm:px-6">
	<header>
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">
			// SERVICES
		</p>

		<h1 class="text-text mb-4 text-3xl sm:text-5xl">
			Selective consulting for the right fit
		</h1>

		<div class="text-secondary max-w-3xl space-y-3 text-sm sm:text-base">
			<p>
				Hiring is the primary path. I also build custom data workflows and ops systems when I
				meet the right people, we vibe, and there is a need I can get passionate about.
			</p>

			<p>
				This is not an agency menu and not volume consulting.
                I'm just passionate about building systems and tools that help people work smarter.
			</p>
		</div>

		<div class="mt-6 flex flex-wrap gap-3">
			<ActionLink
				href="/contact?intent=consult"
				label="Start a Conversation"
				variant="primary"
			/>

			<ActionLink href="/work" label="See Proof" />

			<ActionLink href="/about" label="About" />
		</div>
	</header>
</div>