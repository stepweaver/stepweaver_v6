<script lang="ts">
	import { resolve } from '$app/paths';
	import { workPageCopy } from '$lib/projects/work-copy';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const copy = $derived(workPageCopy(data.projects.length));
</script>

<svelte:head>
	<title>Work | λstepweaver</title>
	<meta name="description" content={copy.description} />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// WORK</p>
		<h1 class="text-text mb-4 text-3xl sm:text-4xl">{copy.title}</h1>
		<p class="text-secondary max-w-2xl text-sm">{copy.explanation}</p>
	</header>

	{#if data.projects.length > 0}
		<section aria-labelledby="projects-heading">
			<h2 id="projects-heading" class="font-ocr text-label mb-3 text-sm tracking-wider">
				PROJECTS
			</h2>
			<div class="border-border/20 bg-border/15 grid grid-cols-1 gap-px border md:grid-cols-2">
				{#each data.projects as project (project.slug)}
					<a
						href={resolve('/(marketing)/work/[slug]', { slug: project.slug })}
						class="bg-panel hover:bg-surface group block p-6 transition-colors"
					>
						<h3 class="text-text group-hover:text-neon mb-2 text-lg transition-colors">
							{project.title}
						</h3>
						<p class="text-secondary text-sm">{project.description}</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
