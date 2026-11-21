<script lang="ts">
	import BackgroundBio from '$lib/components/about/BackgroundBio.svelte';
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import { briefData } from '$lib/data/brief-data';
</script>

<svelte:head>
	<title>About | λstepweaver</title>
	<meta
		name="description"
		content="Stephen Weaver is a Business Systems Developer and Systems Integration Consultant. The work is the system: analysis, integration, automation, custom software, and applied AI."
	/>
</svelte:head>

<div class="about">
	<header class="intro">
		<p class="kicker">// ABOUT</p>

		<h1 class="name">
			{briefData.identity.name}
		</h1>

		<p class="roles">
			{briefData.identity.roles.join(' · ')}
		</p>
	</header>

	<section class="panel overview">
		<div>
			<p class="label">Statement</p>

			<p class="description">
				{briefData.identity.statement}
			</p>
		</div>

		<div>
			<p class="label group-label">
				{briefData.roleFit.title}
			</p>

			<ul class="role-list">
				{#each briefData.roleFit.items as item (item)}
					<li class="description role-item">
						<span class="bullet">·</span>
						<span>{item}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="consulting">
			<p class="label">Selective Consulting</p>

			<p class="description consulting-copy">
				Consulting and hiring conversations are both welcome. The work is business analysis, systems
				integration, automation, custom software, and applied AI. Case studies stay unpublished
				until each one is reviewed.
			</p>

			<a href="/services" class="consulting-link"> See how consulting fits → </a>
		</div>

		<div>
			<p class="label group-label">
				{briefData.stackSnapshot.title}
			</p>

			<div class="stack">
				{#each briefData.stackSnapshot.categories as category (category.label)}
					<div>
						<p class="category">
							{category.label}
						</p>

						<ul class="stack-list">
							{#each category.items as item (item)}
								<li class="stack-item">
									{item}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>

		<div class="actions">
			{#each briefData.ctas as cta (cta.href)}
				<ActionLink
					href={cta.href}
					label={cta.label}
					variant={cta.variant}
					external={'external' in cta && cta.external}
				/>
			{/each}
		</div>
	</section>

	<section class="panel background" aria-labelledby="about-background">
		<div class="background-header">
			<p id="about-background" class="label background-label">Background</p>

			<div class="section-code">
				<div class="section-label">Section</div>

				<div class="section-id">BIO-01</div>
			</div>
		</div>

		<BackgroundBio />
	</section>
</div>

<style>
	.about {
		max-width: 56rem;
		margin-inline: auto;
		padding: var(--space-3xl) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-bottom: var(--space-xl);
	}

	.kicker,
	.name {
		margin-bottom: 0.5rem;
	}

	.kicker,
	.label,
	.category,
	.section-label {
		font-family: var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
	}

	.kicker {
		color: var(--neon);
	}

	.kicker,
	.roles {
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.name {
		color: var(--text);
		font-size: var(--font-size-3xl);
		line-height: 2.25rem;
	}

	.roles,
	.section-label {
		color: var(--text-meta);
	}

	.panel {
		border: 1px solid color-mix(in oklab, var(--neon) 20%, transparent);
		background-color: var(--surface);
		padding: var(--space-lg);
	}

	.overview {
		display: grid;
		gap: var(--space-xl);
	}

	.label,
	.category,
	.section-label {
		text-transform: uppercase;
	}

	.label,
	.category {
		margin-bottom: 0.5rem;
	}

	.label {
		color: var(--text-label);
	}

	.label,
	.consulting-link,
	.stack-item,
	.section-code {
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.group-label,
	.consulting-copy {
		margin-bottom: var(--space-sm);
	}

	.description {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.625;
	}

	.role-list,
	.stack-list {
		display: grid;
		gap: 0.5rem;
	}

	.role-item {
		display: flex;
		gap: 0.5rem;
	}

	.bullet,
	.category {
		color: color-mix(in oklab, var(--neon) 50%, transparent);
	}

	.bullet,
	.section-code {
		flex-shrink: 0;
	}

	.consulting {
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
		background-color: color-mix(in oklab, var(--panel) 15%, transparent);
		padding: var(--space-md);
	}

	.consulting-link {
		color: var(--neon);
		transition: color var(--duration) var(--ease);
	}

	@media (hover: hover) {
		.consulting-link:hover {
			color: var(--accent);
		}
	}

	.stack {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-md);
	}

	.category,
	.background-label,
	.section-label {
		letter-spacing: 0.18em;
	}

	.category {
		font-size: 0.625rem;
	}

	.stack-list {
		gap: 0.25rem;
	}

	.stack-item,
	.section-id {
		color: var(--text-secondary);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		border-top: 1px solid color-mix(in oklab, var(--border) 20%, transparent);
		padding-top: var(--space-md);
	}

	.background {
		margin-top: var(--space-xl);
		scroll-margin-top: var(--space-3xl);
	}

	.background-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.background-label {
		margin-bottom: 0;
	}

	.section-code {
		text-align: right;
	}

	.section-id {
		white-space: nowrap;
	}

	@media (min-width: 40rem) {
		.about {
			padding-inline: var(--space-lg);
		}

		.name {
			font-size: 2.25rem;
			line-height: 2.5rem;
		}

		.panel {
			padding: var(--space-xl);
		}

		.stack {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.background-label {
			font-size: var(--font-size-sm);
			line-height: 1.25rem;
		}
	}
</style>
