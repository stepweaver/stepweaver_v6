<script lang="ts">
	import { SITE_ORIGIN } from '$lib/seo/site';
	import { formatWritingDate } from '$lib/writing/entries';
	import { normalizeTag as tagKey } from '$lib/writing/slug';

	let { data } = $props();

	function pageHref(page: number, tag: string | null) {
		const parts: string[] = [];
		if (tag) parts.push(`tag=${encodeURIComponent(tag)}`);
		if (page > 1) parts.push(`page=${page}`);
		return parts.length ? `/writing?${parts.join('&')}` : '/writing';
	}

	const activeTag = $derived(data.tag ? tagKey(data.tag) : '');
	const canonical = $derived(`${SITE_ORIGIN}${pageHref(data.page, data.tag)}`);
</script>

<svelte:head>
	<title>Writing | λstepweaver</title>
	<meta
		name="description"
		content="Notes on systems, integration, automation, and the decisions around the work."
	/>
	<link rel="canonical" href={canonical} />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="λstepweaver writing"
		href={`${SITE_ORIGIN}/writing/rss.xml`}
	/>
	{#if data.status !== 'ok'}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16 pt-24 sm:px-6">
	<header class="mb-8">
		<p class="font-ocr text-neon mb-2 text-sm tracking-wider">// WRITING</p>
		<h1 class="text-text text-3xl sm:text-4xl">Notes from the work.</h1>
		<p class="text-secondary mt-4 max-w-2xl text-sm leading-relaxed">
			A working notebook: systems, integrations, automation, and the decisions that sit around them.
		</p>
		<p class="mt-3">
			<a class="font-ocr text-neon text-xs tracking-wide" href="/writing/rss.xml">RSS</a>
		</p>
	</header>

	{#if data.status === 'unconfigured'}
		<p class="border-border/30 text-secondary border p-5 text-sm leading-relaxed" role="status">
			The writing source is not configured for this app. Published notes are not listed here, and
			this is not an empty archive.
		</p>
	{:else if data.status === 'unavailable'}
		<p class="border-border/30 text-secondary border p-5 text-sm leading-relaxed" role="status">
			Writing is temporarily unavailable. This is not an empty archive.
		</p>
	{:else}
		{#if data.stale}
			<p class="text-meta mb-4 text-sm" role="status">
				Showing the last copy received. Notion did not answer the latest request.
			</p>
		{/if}
		{#if data.tags.length > 0}
			<nav class="mb-6 flex flex-wrap gap-2" aria-label="Tags">
				<a
					class={`font-ocr border px-2 py-1 text-xs tracking-wide uppercase ${
						activeTag ? 'border-border/30 text-meta' : 'border-neon text-neon'
					}`}
					href="/writing"
				>
					All
				</a>
				{#each data.tags as tag (tag)}
					<a
						class={`font-ocr border px-2 py-1 text-xs tracking-wide uppercase ${
							tagKey(tag) === activeTag ? 'border-neon text-neon' : 'border-border/30 text-meta'
						}`}
						href={pageHref(1, tag)}
					>
						{tag}
					</a>
				{/each}
			</nav>
		{/if}

		{#if data.items.length === 0}
			<p class="text-secondary text-sm">
				{data.tag ? 'No published notes use that tag.' : 'No notes are published yet.'}
			</p>
		{:else}
			<ul class="divide-border/25 border-border/25 divide-y border">
				{#each data.items as post (post.slug)}
					<li class="bg-surface p-5">
						<p class="font-ocr text-meta text-[10px] tracking-wider">
							{formatWritingDate(post.date)}
						</p>
						<h2 class="text-text mt-1 text-xl">
							<a class="hover:text-neon" href={`/writing/${post.slug}`}>{post.title}</a>
						</h2>
						{#if post.excerpt}
							<p class="text-secondary mt-2 line-clamp-3 text-sm leading-relaxed">{post.excerpt}</p>
						{/if}
						{#if post.tags.length > 0}
							<p class="text-meta mt-3 text-xs">{post.tags.join(' · ')}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if data.pages > 1}
			<nav class="mt-6 flex flex-wrap items-center gap-3" aria-label="Pagination">
				{#if data.page > 1}
					<a class="text-neon text-sm" href={pageHref(data.page - 1, data.tag)}>Previous</a>
				{/if}
				<p class="text-meta text-sm">Page {data.page} of {data.pages}</p>
				{#if data.page < data.pages}
					<a class="text-neon text-sm" href={pageHref(data.page + 1, data.tag)}>Next</a>
				{/if}
			</nav>
		{/if}
	{/if}
</div>
