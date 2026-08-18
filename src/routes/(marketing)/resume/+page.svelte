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

<div class="min-h-screen pt-20 pb-16">
	<div class="mx-auto max-w-5xl px-4 sm:px-6">
		<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="font-ocr text-neon mb-2 text-sm tracking-wider">
					{resumeData.identity.eyebrow}
				</p>

				<h1 class="text-text text-3xl sm:text-4xl">
					{resumeData.identity.title}
				</h1>

				<p class="text-meta mt-2 text-sm">
					{resumeData.identity.subtitle}
				</p>
			</div>

			<div class="flex flex-wrap gap-2">
				<ActionLink href="/weaver_resume.pdf" label="Download PDF" variant="primary" />

				<ActionLink href="/about" label="About" />

				<ActionLink href="/contact?intent=hire" label="Contact" />
			</div>
		</header>

		<div class="border-neon/20 bg-surface space-y-10 border p-6 sm:p-8">
			<section>
				<p class="font-ocr text-label mb-3 text-xs tracking-wider uppercase">Identity</p>

				<p class="text-secondary max-w-3xl text-sm leading-relaxed">
					{resumeData.identity.statement}
				</p>
			</section>

			<section>
				<p class="font-ocr text-label mb-3 text-xs tracking-wider uppercase">
					{resumeData.summary.title}
				</p>

				<ul class="max-w-4xl space-y-2">
					{#each resumeData.summary.body as item (item)}
						<li class="text-secondary flex gap-2 text-sm leading-relaxed">
							<span class="text-neon/50 shrink-0">·</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<p class="font-ocr text-label mb-4 text-xs tracking-wider uppercase">
					{resumeData.skills.title}
				</p>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each resumeData.skills.groups as group (group.label)}
						<div class="border-border/25 bg-panel/15 border p-4">
							<p class="font-ocr text-neon/50 mb-3 text-[10px] tracking-[0.18em] uppercase">
								{group.label}
							</p>

							<ul class="flex flex-wrap gap-2">
								{#each group.items as skill (skill)}
									<li class="border-border/30 text-secondary border px-2 py-1 text-xs">
										{skill}
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</section>

			<section>
				<div class="text-label mb-4">
					{resumeData.experience.title.toUpperCase()}
				</div>

				<div class="space-y-6">
					{#each resumeData.experience.roles as role (`${role.org}-${role.role}-${role.when}`)}
						<div class="border-border/25 border p-5">
							<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
								<div>
									<div class="font-ibm text-text text-sm">
										{role.role}
									</div>

									<div class="text-meta text-xs">
										{role.org}
									</div>
								</div>

								<div class="font-ocr text-meta text-xs">
									{role.when}
								</div>
							</div>

							<ul class="mt-3 space-y-2">
								{#each role.bullets as bullet (bullet)}
									<li class="text-secondary flex gap-2 text-sm leading-relaxed">
										<span class="text-neon/50 shrink-0" aria-hidden="true">·</span>
										<span>{bullet}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</section>

			<section>
				<div class="text-label mb-4">
					{resumeData.projects.title.toUpperCase()}
				</div>

				<div class="space-y-4">
					{#each resumeData.projects.items as project (project.href)}
						<div class="border-border/25 bg-panel/15 border p-4">
							<div class="mb-1 flex flex-wrap items-baseline gap-3">
								<span class="font-ibm text-text text-sm">
									{project.label}
								</span>

								<a
									href={project.href}
									class="text-neon hover:text-accent text-xs transition-colors"
								>
									View case study →
								</a>
							</div>

							<p class="text-secondary text-xs leading-relaxed">
								{project.summary}
							</p>
						</div>
					{/each}
				</div>

				<div class="mt-4">
					<a href="/work" class="text-neon hover:text-accent text-sm transition-colors">
						View all projects →
					</a>
				</div>
			</section>

			<section>
				<div class="text-label mb-3">
					{resumeData.education.title.toUpperCase()}
				</div>

				<ul class="space-y-2">
					{#each resumeData.education.items as item (item)}
						<li class="text-secondary text-sm leading-relaxed">
							{item}
						</li>
					{/each}
				</ul>
			</section>
		</div>
	</div>
</div>
