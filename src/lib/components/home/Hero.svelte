<script lang="ts">
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import { identity } from '$lib/data/identity';
</script>

<section class="hero">
	<div class="hero-inner">
		<div class="hero-copy">
			<p class="hero-eyebrow">{identity.positioning.eyebrow}</p>

			<h1 class="hero-title">
				{identity.positioning.headline}
				<span class="hero-title-accent">{identity.positioning.headlineAccent}</span>
			</h1>

			<p class="hero-lede">
				{identity.positioning.lede}
			</p>

			<div class="hero-actions">
				<ActionLink href={identity.links.work} label="View Work" variant="primary" />
				<ActionLink href={identity.links.resume} label="Resume" />
				<ActionLink href={identity.links.contactHire} label="Contact" />
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		min-block-size: 100vh;
		padding-inline: var(--space-lg);
		padding-block: var(--space-3xl);
		background: var(--canvas);
		color: var(--text);
	}

	.hero-inner {
		display: flex;
		align-items: center;
		min-block-size: 70vh;
		max-inline-size: var(--content-width-narrow);
		margin-inline: auto;
	}

	.hero-copy {
		max-inline-size: 48rem;
	}

	.hero-eyebrow {
		margin-block-end: var(--space-md);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-sm);
		color: var(--neon);
		letter-spacing: var(--letter-spacing-label);
		text-transform: uppercase;
	}

	.hero-title {
		font-size: clamp(2.25rem, 1.4rem + 4vw, 3.75rem);
		font-weight: 600;
		line-height: var(--line-height-tight);
	}

	.hero-title-accent {
		display: block;
		color: var(--neon);
	}

	.hero-lede {
		max-inline-size: 42rem;
		margin-block-start: var(--space-lg);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		color: var(--text-muted);
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-block-start: var(--space-xl);
	}
</style>
