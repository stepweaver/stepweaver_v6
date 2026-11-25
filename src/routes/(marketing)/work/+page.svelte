<script lang="ts">
	import { resolve } from '$app/paths';
	import { workPageCopy } from '$lib/projects/work-copy';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const copy = $derived(workPageCopy(data.projects.length));
</script>

<div class="work">
	<header class="intro">
		<p class="kicker">// WORK</p>
		<h1>{copy.title}</h1>
		<p class="explanation">{copy.explanation}</p>
	</header>

	{#if data.projects.length > 0}
		<section aria-labelledby="projects-heading">
			<h2 id="projects-heading">PROJECTS</h2>
			<div class="project-grid">
				{#each data.projects as project (project.slug)}
					<a
						href={resolve('/(marketing)/work/[slug]', { slug: project.slug })}
						class="project-card"
					>
						<h3>{project.title}</h3>
						<p>{project.description}</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.work {
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-bottom: var(--space-xl);
	}

	.kicker,
	h2 {
		font-family: var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	h1 {
		margin-bottom: var(--space-md);
		color: var(--text);
		font-size: var(--font-size-3xl);
		line-height: 2.25rem;
	}

	.explanation {
		max-inline-size: 42rem;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	h2 {
		margin-bottom: 0.75rem;
		color: var(--text-label);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.project-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1px;
		border: 1px solid color-mix(in oklab, var(--border) 20%, transparent);
		background: color-mix(in oklab, var(--border) 15%, transparent);
	}

	.project-card {
		display: block;
		background: var(--panel);
		padding: var(--space-lg);
		transition:
			background-color var(--duration) var(--ease),
			color var(--duration) var(--ease);
	}

	.project-card h3 {
		margin-bottom: 0.5rem;
		color: var(--text);
		font-size: var(--font-size-lg);
		line-height: 1.75rem;
		transition: color var(--duration) var(--ease);
	}

	.project-card p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	@media (hover: hover) {
		.project-card:hover {
			background: var(--surface);
		}

		.project-card:hover h3 {
			color: var(--neon);
		}
	}

	@media (min-width: 40rem) {
		.work {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 2.25rem;
			line-height: 2.5rem;
		}
	}

	@media (min-width: 48rem) {
		.project-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
