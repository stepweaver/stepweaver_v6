<script lang="ts">
	import { invalidate } from '$app/navigation';
	import OperatorCard from '$lib/components/home/OperatorCard.svelte';
	import WritingSection from '$lib/components/home/WritingSection.svelte';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import { identity } from '$lib/data/identity';

	let { data } = $props();
	let refreshAttempts = $state(0);
	$effect(() => {
		if (!data.writingPending || refreshAttempts >= 3) return;
		const timer = setTimeout(() => {
			refreshAttempts += 1;
			void invalidate('app:home-writing');
		}, 4_000);
		return () => clearTimeout(timer);
	});
</script>

<section class="hero">
	<div class="hero-copy">
		<p class="eyebrow"><LambdaText text={identity.positioning.eyebrow} /></p>
		<h1>
			<span class="phrase">{identity.positioning.headline}</span>
			<span class="phrase accent">{identity.positioning.headlineAccent}</span>
		</h1>
		<p class="lede">{identity.positioning.lede}</p>
		<div class="actions">
			<ActionLink href="/terminal" label="Open Terminal" variant="primary" />
			<ActionLink href={identity.links.resume} label="Résumé" />
		</div>
		<p class="find">
			<a href="/writing">Writing</a>
			<a href={identity.links.about}>About</a>
		</p>
		<p class="support">
			<a href={identity.links.contact}>Contact</a>
		</p>
	</div>
	<div class="hero-card">
		<OperatorCard />
	</div>
</section>

<WritingSection writing={data.writing} pending={data.writingPending && refreshAttempts < 3} />

<style>
	.hero {
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
		padding-inline: var(--space-lg);
		display: grid;
		gap: var(--space-lg);
		padding-block: var(--space-md) var(--space-xl);
	}

	h1 {
		font-size: clamp(1.15rem, 7.05vw - 0.25rem, 2rem);
		line-height: var(--line-height-tight);
	}

	.phrase {
		display: block;
		max-inline-size: 100%;
		text-wrap: balance;
	}

	.accent {
		color: var(--neon);
	}

	.lede {
		max-inline-size: 46rem;
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.eyebrow,
	.find,
	.support {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.eyebrow {
		color: var(--neon);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-block-start: var(--space-lg);
	}

	.find,
	.support {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin-block-start: var(--space-md);
	}

	.find a {
		color: var(--text);
		padding-block: 0.35rem;
	}

	.support {
		margin-block-start: var(--space-sm);
	}

	.support a {
		color: var(--text-muted);
		padding-block: 0.35rem;
	}

	a:hover {
		color: var(--neon);
	}

	@media (width >= 64rem) {
		h1 {
			font-size: clamp(2.25rem, 1.4rem + 4vw, 3.75rem);
		}

		.hero {
			grid-template-columns: minmax(22rem, 32rem) minmax(0, 1fr);
			align-items: start;
			gap: var(--space-xl);
			padding-block: var(--space-2xl);
		}

		.hero-card {
			grid-column: 1;
			grid-row: 1;
		}

		.hero-copy {
			grid-column: 2;
			grid-row: 1;
		}
	}
</style>
