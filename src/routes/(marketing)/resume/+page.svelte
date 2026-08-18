<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import { resumeData } from '$lib/data/resume-data';
</script>

<svelte:head>
	<title>Resume | λstepweaver</title>
	<meta
		name="description"
		content="Professional background: systems, automation, and business-facing software."
	/>
</svelte:head>

<div class="min-h-screen pb-16 pt-20">
	<div class="mx-auto max-w-5xl px-4 sm:px-6">
		<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="mb-2 font-ocr text-sm tracking-wider text-neon">
					{resumeData.identity.eyebrow}
				</p>

				<h1 class="text-3xl text-text sm:text-4xl">
					{resumeData.identity.title}
				</h1>

				<p class="mt-2 text-sm text-meta">
					{resumeData.identity.subtitle}
				</p>
			</div>

			<div class="flex flex-wrap gap-2">
				<ActionLink href="/weaver_resume.pdf" label="Download PDF" variant="primary" />

				<ActionLink href="/about" label="About" />

				<ActionLink href="/contact?intent=hire" label="Contact" />
			</div>
		</header>

		<div class="space-y-10 border border-neon/20 bg-surface p-6 sm:p-8">
			<section>
				<p class="mb-3 font-ocr text-xs uppercase tracking-wider text-label">
					Identity
				</p>

				<p class="max-w-3xl text-sm leading-relaxed text-secondary">
					{resumeData.identity.statement}
				</p>
			</section>

			<section>
				<p class="mb-3 font-ocr text-xs uppercase tracking-wider text-label">
					{resumeData.summary.title}
				</p>

				<ul class="max-w-4xl space-y-2">
					{#each resumeData.summary.body as item (item)}
						<li class="flex gap-2 text-sm leading-relaxed text-secondary">
							<span class="shrink-0 text-neon/50">·</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<p class="mb-4 font-ocr text-xs uppercase tracking-wider text-label">
					{resumeData.skills.title}
				</p>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each resumeData.skills.groups as group (group.label)}
						<div class="border border-border/25 bg-panel/15 p-4">
							<p
								class="mb-3 font-ocr text-[10px] uppercase tracking-[0.18em] text-neon/50"
							>
								{group.label}
							</p>

							<ul class="flex flex-wrap gap-2">
								{#each group.items as skill (skill)}
									<li
										class="border border-border/30 px-2 py-1 text-xs text-secondary"
									>
										{skill}
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>