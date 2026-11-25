<script lang="ts">
	import type { PageProps } from './$types';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import { upperLabel } from '$lib/text/lambda';

	let { data }: PageProps = $props();

	const project = $derived(data.kind === 'case-study' ? data.project : null);
	const record = $derived(data.kind === 'record' ? data : null);
</script>

<div class="case">
	<a class="back" href="/work">← BACK TO WORK</a>

	{#if record}
		<section class="record">
			<h1><LambdaText text={record.card.title} /></h1>
			<p>{record.card.description}</p>
		</section>
	{/if}

	{#if project}
		<div class="layout">
			<aside class="brief-column">
				<section class="panel">
					<p class="panel-label brief-label">SYS.BRIEF</p>

					<h1>
						<LambdaText text={project.title} />
					</h1>

					<p class="status">
						[{upperLabel(project.status)}]
					</p>

					<p class="brief-copy">
						{project.description}
					</p>
				</section>

				{#if project.builtFor || project.solved || project.delivered?.length}
					<section class="panel summary">
						<p class="panel-label">SUMMARY</p>

						{#if project.builtFor}
							<div>
								<p class="summary-label">Context / Users</p>

								<p class="summary-copy">
									{project.builtFor}
								</p>
							</div>
						{/if}

						{#if project.solved}
							<div>
								<p class="summary-label">What changed</p>

								<p class="summary-copy">
									{project.solved}
								</p>
							</div>
						{/if}

						{#if project.delivered?.length}
							<div>
								<p class="summary-label">Key decisions</p>

								<ul class="decisions">
									{#each project.delivered.slice(0, 4) as item (item)}
										<li>
											<span class="bullet">·</span>
											<span>{item}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</section>
				{/if}

				{#if project.tags.length}
					<section class="panel">
						<p class="panel-label tags-label">TAGS</p>

						<div class="tags">
							{#each project.tags as tag (tag)}
								<span>{tag}</span>
							{/each}
						</div>
					</section>
				{/if}
			</aside>

			<main class="study">
				<section class="panel study-panel">
					<p class="panel-label study-label">CASE STUDY</p>

					<h2>
						{project.title}
					</h2>

					<p class="study-copy">
						{project.description}
					</p>
				</section>
			</main>
		</div>
	{/if}
</div>

<style>
	.case {
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.back,
	.panel-label,
	.status,
	.summary-label {
		font-family: var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
	}

	.back {
		display: inline-block;
		margin-bottom: var(--space-lg);
		color: var(--neon);
		font-size: var(--font-size-xs);
		line-height: 1rem;
		transition: color var(--duration) var(--ease);
	}

	.record h1,
	.panel h1,
	.study h2 {
		color: var(--text);
	}

	.record,
	.panel {
		border: 1px solid color-mix(in oklab, var(--border) 20%, transparent);
		background: var(--panel);
	}

	.record {
		padding: var(--space-lg);
	}

	.record h1,
	.panel h1 {
		margin-bottom: 0.75rem;
		font-size: var(--font-size-xl);
		line-height: 1.75rem;
	}

	.record p,
	.brief-copy {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-xl);
	}

	.brief-column,
	.summary {
		display: grid;
		gap: var(--space-md);
	}

	.panel {
		padding: var(--space-md);
	}

	.study-panel {
		padding: var(--space-lg);
	}

	.panel-label {
		color: var(--text-label);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.panel h1,
	.status,
	.study-label {
		margin-bottom: 0.75rem;
	}

	.brief-label,
	.tags-label {
		margin-bottom: 0.5rem;
	}

	.study h2 {
		margin-bottom: 0.75rem;
	}

	.status {
		color: var(--neon);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.summary-label {
		margin-bottom: 0.25rem;
		color: color-mix(in oklab, var(--neon) 60%, transparent);
		font-size: 0.625rem;
		line-height: 1.5;
		text-transform: uppercase;
	}

	.summary-copy,
	.decisions {
		color: var(--text-secondary);
		font-size: var(--font-size-xs);
		line-height: 1.625;
	}

	.decisions {
		display: grid;
		gap: 0.25rem;
	}

	.decisions li {
		display: flex;
		gap: 0.5rem;
	}

	.bullet {
		flex-shrink: 0;
		color: color-mix(in oklab, var(--neon) 50%, transparent);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.tags span {
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		padding: 0.125rem 0.5rem;
		color: var(--text-secondary);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.study {
		min-inline-size: 0;
	}

	.study h2 {
		font-size: var(--font-size-2xl);
		line-height: 2rem;
	}

	.study-copy {
		max-inline-size: 48rem;
		color: var(--text-secondary);
		line-height: 1.625;
	}

	@media (hover: hover) {
		.back:hover {
			color: var(--accent);
		}
	}

	@media (min-width: 40rem) {
		.case {
			padding-inline: var(--space-lg);
		}
	}

	@media (min-width: 64rem) {
		.layout {
			grid-template-columns: 17.5rem minmax(0, 1fr);
		}
	}
</style>
