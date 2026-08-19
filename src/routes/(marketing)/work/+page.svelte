<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Work | λstepweaver</title>
	<meta
		name="description"
		content="Featured case studies and project archive: operations systems, internal tools, and AI-assisted workflows."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// WORK</p>

		<h1 class="text-text mb-4 text-3xl sm:text-4xl">Selected Work</h1>

		<p class="text-secondary max-w-2xl text-sm">
			Flagship case studies first: operations systems, internal tools, and AI-assisted workflows,
			then the full archive.
		</p>
	</header>

	<section aria-labelledby="projects-heading">
		<h2 id="projects-heading" class="font-ocr text-label mb-3 text-sm tracking-wider">
			PROJECTS
		</h2>

		<div class="border-border/20 bg-border/15 grid grid-cols-1 gap-px border md:grid-cols-2">
			{#each data.projects as project (project.slug)}
				<article class="bg-panel p-6">
					<div class="mb-3 flex items-start justify-between gap-4">
						<p class="text-label font-ocr text-xs tracking-wider">
							{project.slug.toUpperCase().replaceAll('-', '_')}
						</p>

						<p class="text-neon font-ocr text-xs tracking-wider">
							[{project.status.toUpperCase()}]
						</p>
					</div>

					<h3 class="text-text mb-2 text-lg">
						{project.title}
					</h3>

					<p class="text-secondary mb-4 text-sm">
						{project.description}
					</p>

					{#if project.builtFor || project.solved}
						<p class="text-meta mb-4 text-xs">
							{[project.builtFor, project.solved].filter(Boolean).join(' · ')}
						</p>
					{/if}

					<div class="flex flex-wrap gap-1.5">
						{#each project.tags.slice(0, 6) as tag (tag)}
							<span class="border-border/20 text-meta border px-1.5 py-0.5 text-xs">
								{tag}
							</span>
						{/each}

						{#if project.tags.length > 6}
							<span class="text-muted px-1.5 py-0.5 text-xs">
								+{project.tags.length - 6}
							</span>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</section>
</div>