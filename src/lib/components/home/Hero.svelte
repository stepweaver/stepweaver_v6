<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
</script>

<section class="min-h-screen bg-canvas px-6 py-24 text-text">
	<div class="mx-auto flex min-h-[70vh] max-w-5xl items-center">
		<div class="max-w-3xl">
			<p class="mb-4 font-ocr text-sm tracking-[0.25em] text-neon uppercase">
				λstepweaver // systems builder
			</p>

			<h1 class="text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
				Product-minded systems
				<span class="block text-neon">for operations-heavy teams</span>
			</h1>

			<p class="mt-6 max-w-2xl text-base leading-7 text-muted">
				I design and ship internal tools, workflow automations, and AI-assisted systems that turn
				messy business processes into dependable software.
			</p>

			<div class="mt-8 flex flex-wrap gap-3">
				<ActionLink href="/work" label="View Work" variant="primary" />
				<ActionLink href="/resume" label="Resume" />
				<ActionLink href="/contact?intent=hire" label="Contact" />
			</div>
		</div>
	</div>
</section>