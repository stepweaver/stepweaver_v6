<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
</script>

<section class="bg-canvas text-text min-h-screen px-6 py-24">
	<div class="mx-auto flex min-h-[70vh] max-w-5xl items-center">
		<div class="max-w-3xl">
			<p class="font-ocr text-neon mb-4 text-sm tracking-[0.25em] uppercase">
				λstepweaver // systems builder
			</p>

			<h1 class="text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
				Product-minded systems
				<span class="text-neon block">for operations-heavy teams</span>
			</h1>

			<p class="text-muted mt-6 max-w-2xl text-base leading-7">
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
