<script lang="ts">
	import { jsonLdScript } from '$lib/seo/json-ld';
	import type { PageMetadata } from '$lib/seo/metadata';

	let { meta }: { meta: PageMetadata } = $props();
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={meta.canonical} />
	{#if meta.robots}
		<meta name="robots" content={meta.robots} />
	{/if}
	<meta property="og:title" content={meta.ogTitle} />
	<meta property="og:description" content={meta.ogDescription} />
	<meta property="og:type" content={meta.ogType} />
	<meta property="og:url" content={meta.ogUrl} />
	<meta property="og:site_name" content={meta.siteName} />
	<meta property="og:locale" content={meta.locale} />
	<meta property="og:image" content={meta.image.url} />
	<meta property="og:image:width" content={String(meta.image.width)} />
	<meta property="og:image:height" content={String(meta.image.height)} />
	<meta property="og:image:type" content={meta.image.type} />
	<meta property="og:image:alt" content={meta.image.alt} />
	<meta name="twitter:card" content={meta.twitterCard} />
	<meta name="twitter:title" content={meta.ogTitle} />
	<meta name="twitter:description" content={meta.ogDescription} />
	<meta name="twitter:image" content={meta.image.url} />
	<meta name="twitter:image:alt" content={meta.image.alt} />
	{#if meta.publishedTime}
		<meta property="article:published_time" content={meta.publishedTime} />
	{/if}
	{#if meta.modifiedTime}
		<meta property="article:modified_time" content={meta.modifiedTime} />
	{/if}
	{#each meta.tags as tag, index (`${index}:${tag}`)}
		<meta property="article:tag" content={tag} />
	{/each}
	{#each meta.jsonLd as block, index (`ld-${index}`)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(block)}
	{/each}
</svelte:head>
