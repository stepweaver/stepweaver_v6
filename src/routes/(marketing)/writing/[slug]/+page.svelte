<script lang="ts">
	import BlockBody from '$lib/components/writing/BlockBody.svelte';
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

<article class="mx-auto max-w-3xl px-4 py-16 pt-24 sm:px-6">
	<p class="mb-8">
		<a class="font-ocr text-neon text-xs tracking-wider uppercase" href="/writing">← Writing</a>
	</p>
	<header class="mb-8">
		<p class="font-ocr text-meta text-xs tracking-wider">
			{formatWritingDate(data.post.date)}
			{#if data.post.updated && data.post.updated !== data.post.date}
				· Updated {formatWritingDate(data.post.updated)}
			{/if}
		</p>
		<h1 class="text-text mt-3 text-3xl leading-tight sm:text-5xl">{data.post.title}</h1>
		{#if data.post.excerpt}
			<p class="text-secondary mt-4 max-w-2xl text-base leading-relaxed">{data.post.excerpt}</p>
		{/if}
		{#if data.post.tags.length > 0}
			<ul class="mt-4 flex flex-wrap gap-2">
				{#each data.post.tags as tag (tag)}
					<li>
						<a
							class="font-ocr border-border/40 text-secondary hover:border-neon hover:text-neon border px-2 py-1 text-xs tracking-wide uppercase"
							href={`/writing?tag=${encodeURIComponent(tag)}`}
						>
							#{tag}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</header>
	{#if data.blocksUnavailable}
		<p class="text-secondary" role="status">
			The article text is temporarily unavailable. The title above is still the published note.
		</p>
	{:else}
		<BlockBody blocks={data.blocks} />
	{/if}
</article>
