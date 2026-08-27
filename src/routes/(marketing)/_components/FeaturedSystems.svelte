<script lang="ts">
	import { resolve } from '$app/paths';
	import { identity } from '$lib/data/identity';
	import type { Project } from '$lib/projects/types';

	type Props = {
		projects: readonly Project[];
	};

	let { projects }: Props = $props();
</script>

<section class="featured" aria-labelledby="featured-systems-heading">
	<div class="featured-inner">
		<h2 id="featured-systems-heading" class="featured-title">Featured systems</h2>

		<p class="featured-lede">
			Each system shows a different operational problem modeled end to end: workflow, data,
			interface, and deployment.
		</p>

		<div class="featured-grid">
			{#each projects as project (project.slug)}
				<a class="featured-card" href={resolve('/(marketing)/work/[slug]', { slug: project.slug })}>
					<div class="featured-card-meta">
						<p class="featured-card-id">
							{project.slug.toUpperCase().replaceAll('-', '_')}
						</p>

						<p class="featured-card-status">
							[{project.status.toUpperCase()}]
						</p>
					</div>

					<h3 class="featured-card-title">{project.title}</h3>

					{#if project.cardBuiltFor}
						<p class="featured-card-context">{project.cardBuiltFor}</p>
					{/if}

					<p class="featured-card-body">
						{project.cardDescription ?? project.description}
					</p>
				</a>
			{/each}
		</div>

		<p class="featured-more">
			<a href={identity.links.work}>All selected work →</a>
		</p>
	</div>
</section>

<style>
	.featured {
		padding-inline: var(--space-lg);
		padding-block: var(--space-2xl);
		background: var(--canvas);
		color: var(--text);
	}

	.featured-inner {
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
	}

	.featured-title {
		margin-block-end: var(--space-sm);
		font-size: clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem);
		line-height: var(--line-height-tight);
	}

	.featured-lede {
		max-inline-size: 42rem;
		margin-block-end: var(--space-lg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
	}

	.featured-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1px;
		border: 1px solid var(--border-muted);
		background: var(--border-muted);
	}

	.featured-card {
		display: block;
		padding: var(--space-lg);
		background: var(--panel);
		transition: background-color var(--duration) var(--ease);

		&:hover {
			background: color-mix(in oklch, var(--neon) 4%, var(--panel));
		}

		&:hover .featured-card-title {
			color: var(--neon);
		}

		&:only-child {
			grid-column: 1 / -1;
		}
	}

	.featured-card-meta {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		margin-block-end: var(--space-sm);
	}

	.featured-card-id,
	.featured-card-status {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
	}

	.featured-card-id {
		color: var(--text-label);
	}

	.featured-card-status {
		color: var(--neon);
	}

	.featured-card-title {
		margin-block-end: var(--space-sm);
		font-size: var(--font-size-lg);
		line-height: var(--line-height-snug);
		transition: color var(--duration) var(--ease);
	}

	.featured-card-context {
		margin-block-end: var(--space-sm);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		color: color-mix(in oklch, var(--neon) 75%, transparent);
	}

	.featured-card-body {
		display: -webkit-box;
		overflow: hidden;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-relaxed);
		color: var(--text-secondary);
		line-clamp: 3;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
	}

	.featured-more {
		margin-block-start: var(--space-md);
		font-size: var(--font-size-xs);

		a {
			color: var(--neon);
			transition: color var(--duration) var(--ease);

			&:hover {
				color: var(--accent);
			}
		}
	}

	@media (width >= 48rem) {
		.featured-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
