<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import { AGENT_OWNERSHIP_NOTE, WHAT_I_DO } from '$lib/data/identity';
</script>

<svelte:head>
	<title>Services | λstepweaver</title>
	<meta
		name="description"
		content="Business analysis, systems integration, automation, custom software, and applied AI for real operations."
	/>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-12 px-4 py-16 pt-24 sm:px-6">
	<header>
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// WHAT I DO</p>

		<h1 class="text-text mb-4 text-3xl sm:text-5xl">Systems work for real operations.</h1>

		<div class="text-secondary max-w-3xl space-y-3 text-sm sm:text-base">
			<p>
				I help when a workflow, an integration, or a piece of software is in the way of the work.
				This is not an agency menu and not a list of unverified case studies.
			</p>
		</div>

		<div class="mt-6 flex flex-wrap gap-3">
			<ActionLink
				href="/contact?intent=consult"
				label="Let's talk about your system"
				variant="primary"
			/>
			<ActionLink href="/about" label="About" />
		</div>
	</header>

	<section>
		<div class="text-label mb-4">HOW I CAN HELP</div>

		<div class="border-border/20 bg-border/15 grid grid-cols-1 gap-px border md:grid-cols-2">
			{#each WHAT_I_DO as offer (offer.title)}
				<div class="bg-panel scroll-mt-24 p-6">
					<h2 class="font-ibm text-text mb-2 text-lg">{offer.title}</h2>
					<p class="text-secondary text-sm leading-relaxed">{offer.body}</p>
				</div>
			{/each}
		</div>
		<p class="text-secondary mt-6 max-w-3xl text-sm">{AGENT_OWNERSHIP_NOTE}</p>
	</section>

	<div
		class="border-border/25 bg-surface flex flex-col gap-4 border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
	>
		<div>
			<div class="text-label mb-2">NEXT STEP</div>

			<p class="text-secondary max-w-xl text-sm">
				Tell me what is broken, what you are building, and why it matters. If it is a hire
				conversation, say that too.
			</p>
		</div>

		<div class="shrink-0">
			<ActionLink href="/contact?intent=consult" label="Get in Touch" variant="primary" />
		</div>
	</div>
</div>
