<script lang="ts">
	import { SITE_ORIGIN } from '$lib/seo/origin';
	import LambdaText from '$lib/components/site/LambdaText.svelte';
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

<div class="writing">
	<header class="intro">
		<p class="kicker">// WRITING</p>
		<h1>Notes from the work.</h1>
		<p class="lede">
			A working notebook: systems, integrations, automation, and the decisions that sit around them.
		</p>
		<p class="feed">
			<a href="/writing/rss.xml">RSS</a>
		</p>
	</header>

	{#if data.status === 'unconfigured'}
		<p class="notice" role="status">
			The writing source is not configured for this app. Published notes are not listed here, and
			this is not an empty archive.
		</p>
	{:else if data.status === 'unavailable'}
		<p class="notice" role="status">
			Writing is temporarily unavailable. This is not an empty archive.
		</p>
	{:else}
		{#if data.stale}
			<p class="stale" role="status">
				Showing the last copy received. Notion did not answer the latest request.
			</p>
		{/if}
		{#if data.tags.length > 0}
			<nav class="tags" aria-label="Tags">
				<a
					class="tag"
					class:tag-active={!activeTag}
					class:tag-idle={Boolean(activeTag)}
					href="/writing"
				>
					All
				</a>
				{#each data.tags as tag (tag)}
					<a
						class="tag"
						class:tag-active={tagKey(tag) === activeTag}
						class:tag-idle={tagKey(tag) !== activeTag}
						href={pageHref(1, tag)}
					>
						<LambdaText text={tag} />
					</a>
				{/each}
			</nav>
		{/if}

		{#if data.items.length === 0}
			<p class="empty">
				{data.tag ? 'No published notes use that tag.' : 'No notes are published yet.'}
			</p>
		{:else}
			<ul class="posts">
				{#each data.items as post (post.slug)}
					<li>
						<p class="post-date">
							{formatWritingDate(post.date)}
						</p>
						<h2 class="post-title">
							<a href={`/writing/${post.slug}`}><LambdaText text={post.title} /></a>
						</h2>
						{#if post.excerpt}
							<p class="excerpt">{post.excerpt}</p>
						{/if}
						{#if post.tags.length > 0}
							<p class="post-tags">
								{#each post.tags as tag, index (tag)}
									{#if index > 0}<span aria-hidden="true"> · </span>{/if}<LambdaText text={tag} />
								{/each}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if data.pages > 1}
			<nav class="pager" aria-label="Pagination">
				{#if data.page > 1}
					<a href={pageHref(data.page - 1, data.tag)}>Previous</a>
				{/if}
				<p>Page {data.page} of {data.pages}</p>
				{#if data.page < data.pages}
					<a href={pageHref(data.page + 1, data.tag)}>Next</a>
				{/if}
			</nav>
		{/if}
	{/if}
</div>

<style>
	.writing {
		max-inline-size: 48rem;
		margin-inline: auto;
		padding: var(--page-top-space, var(--space-3xl)) var(--space-md) var(--space-2xl);
	}

	.intro {
		margin-bottom: var(--space-xl);
	}

	.kicker,
	.feed a,
	.tag,
	.post-date {
		font-family: var(--font-family-ocr);
	}

	.kicker {
		margin-bottom: 0.5rem;
		color: var(--neon);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
		letter-spacing: var(--letter-spacing-wide);
	}

	h1,
	.post-title {
		color: var(--text);
	}

	h1 {
		font-size: var(--font-size-3xl);
		line-height: 2.25rem;
	}

	.lede,
	.notice,
	.empty,
	.excerpt {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.625;
	}

	.lede {
		max-inline-size: 42rem;
		margin-top: var(--space-md);
	}

	.feed {
		margin-top: 0.75rem;
	}

	.feed a {
		color: var(--neon);
		font-size: var(--font-size-xs);
		line-height: 1rem;
		letter-spacing: 0.025em;
	}

	.notice {
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		padding: 1.25rem;
	}

	.stale {
		margin-bottom: var(--space-md);
		color: var(--text-meta);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: var(--space-lg);
	}

	.tag {
		border: 1px solid transparent;
		padding: 0.25rem 0.5rem;
		font-size: var(--font-size-xs);
		line-height: 1rem;
		letter-spacing: 0.025em;
		text-transform: uppercase;
	}

	.tag-active {
		border-color: var(--neon);
		color: var(--neon);
	}

	.tag-idle {
		border-color: color-mix(in oklab, var(--border) 30%, transparent);
		color: var(--text-meta);
	}

	.posts {
		border: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
	}

	.posts > li {
		background: var(--surface);
		padding: 1.25rem;
	}

	.posts > li + li {
		border-top: 1px solid color-mix(in oklab, var(--border) 25%, transparent);
	}

	.post-date {
		color: var(--text-meta);
		font-size: 0.625rem;
		line-height: 1.5;
		letter-spacing: var(--letter-spacing-wide);
	}

	.post-title {
		margin-top: 0.25rem;
		font-size: var(--font-size-xl);
		line-height: 1.75rem;
	}

	.post-title a {
		transition: color var(--duration) var(--ease);
	}

	.excerpt {
		display: -webkit-box;
		margin-top: 0.5rem;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}

	.post-tags {
		margin-top: 0.75rem;
		color: var(--text-meta);
		font-size: var(--font-size-xs);
		line-height: 1rem;
	}

	.pager {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		margin-top: var(--space-lg);
		font-size: var(--font-size-sm);
		line-height: 1.25rem;
	}

	.pager a {
		color: var(--neon);
	}

	.pager p {
		color: var(--text-meta);
	}

	@media (hover: hover) {
		.post-title a:hover {
			color: var(--neon);
		}
	}

	@media (min-width: 40rem) {
		.writing {
			padding-inline: var(--space-lg);
		}

		h1 {
			font-size: 2.25rem;
			line-height: 2.5rem;
		}
	}
</style>
