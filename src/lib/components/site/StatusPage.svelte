<script lang="ts">
	type Props = {
		kicker: string;
		title: string;
		body: string;
		points: readonly string[];
	};

	let { kicker, title, body, points }: Props = $props();
</script>

<svelte:head>
	<title>{title} | λstepweaver</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="status">
	<p class="eyebrow">{kicker}</p>
	<h1>{title}</h1>
	<p>{body}</p>
	<ul>
		{#each points as point (point)}
			<li>{point}</li>
		{/each}
	</ul>
</div>

<style>
	.status {
		max-inline-size: 46rem;
		margin-inline: auto;
		padding: var(--space-3xl) var(--space-lg);
	}

	.eyebrow {
		font-family: var(--font-family-ocr);
		color: var(--neon);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
		margin-block-end: var(--space-sm);
	}

	h1 {
		font-size: var(--font-size-3xl);
		margin-block-end: var(--space-md);
	}

	p,
	li {
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
	}

	ul {
		margin-block-start: var(--space-md);
		display: grid;
		gap: var(--space-sm);
	}
</style>
