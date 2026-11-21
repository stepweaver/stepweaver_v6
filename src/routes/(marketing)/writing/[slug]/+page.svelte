<script lang="ts">
	import BlockBody from '$lib/components/writing/BlockBody.svelte';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import { jsonLdScript } from '$lib/seo/json-ld';
	import { SITE_ORIGIN } from '$lib/seo/site';
	import { formatWritingDate } from '$lib/writing/entries';

	let { data } = $props();

	const canonical = $derived(`${SITE_ORIGIN}/writing/${data.post.slug}`);
	const description = $derived(data.post.excerpt || data.post.title);
	const shareImage = `${SITE_ORIGIN}/images/lambda_stepweaver.png`;
	const structured = $derived(
		jsonLdScript({
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			headline: data.post.title,
			datePublished: data.post.date,
			dateModified: data.post.updated || data.post.date,
			description,
			url: canonical,
			author: { '@type': 'Person', name: 'Stephen Weaver' },
			mainEntityOfPage: canonical
		})
	);
</script>

<svelte:head>
	<title>{data.post.title} | λstepweaver</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={shareImage} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={shareImage} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html structured}
</svelte:head>

<article class="article">
	<p class="back">
		<a href="/writing">← Writing</a>
	</p>
	<header class="article-header">
		<p class="dateline">
			{formatWritingDate(data.post.date)}
			{#if data.post.updated && data.post.updated !== data.post.date}
				· Updated {formatWritingDate(data.post.updated)}
			{/if}
		</p>
		<h1><LambdaText text={data.post.title} /></h1>
		{#if data.post.excerpt}
			<p class="dek">{data.post.excerpt}</p>
		{/if}
		{#if data.post.tags.length > 0}
			<ul class="article-tags">
				{#each data.post.tags as tag (tag)}
					<li>
						<a href={`/writing?tag=${encodeURIComponent(tag)}`}>#<LambdaText text={tag} /></a>
					</li>
				{/each}
			</ul>
		{/if}
	</header>
	{#if data.blocksUnavailable}
		<p class="unavailable" role="status">
			The article text is temporarily unavailable. The title above is still the published note.
		</p>
	{:else}
		<BlockBody blocks={data.blocks} />
	{/if}
</article>

<style>
	.article {
		max-inline-size: 48rem;
		margin-inline: auto;
		padding: var(--space-3xl) var(--space-md) var(--space-2xl);
	}

	.back {
		margin-bottom: var(--space-xl);
	}

	.back a,
	.dateline,
	.article-tags a {
		font-family: var(--font-family-ocr);
		letter-spacing: var(--letter-spacing-wide);
	}

	.back a,
	.article-tags a {
		font-size: var(--font-size-xs);
		line-height: 1rem;
		letter-spacing: 0.025em;
		text-transform: uppercase;
	}

	.back a {
		color: var(--neon);
		letter-spacing: var(--letter-spacing-wide);
	}

	.article-header {
		margin-bottom: var(--space-xl);
	}

	.dateline {
		color: var(--text-meta);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	h1 {
		margin-top: 0.75rem;
		color: var(--text);
		font-size: var(--font-size-3xl);
		line-height: 1.25;
	}

	.dek,
	.unavailable {
		color: var(--text-secondary);
	}

	.dek {
		max-inline-size: 42rem;
		margin-top: var(--space-md);
		font-size: var(--font-size-base);
		line-height: 1.625;
	}

	.article-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: var(--space-md);
	}

	.article-tags a {
		border: 1px solid color-mix(in oklab, var(--border) 40%, transparent);
		padding: 0.25rem 0.5rem;
		color: var(--text-secondary);
		transition:
			color var(--duration) var(--ease),
			border-color var(--duration) var(--ease);
	}

	@media (hover: hover) {
		.article-tags a:hover {
			border-color: var(--neon);
			color: var(--neon);
		}
	}

	@media (min-width: 40rem) {
		.article {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 3rem;
		}
	}
</style>
