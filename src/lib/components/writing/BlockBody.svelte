<script lang="ts">
	import type { RenderBlock } from '$lib/writing/types';
	import RichText from './RichText.svelte';

	let { blocks }: { blocks: RenderBlock[] } = $props();
</script>

<div class="article-body">
	{#each blocks as block, index (`${block.type}-${index}`)}
		{#if block.type === 'paragraph'}
			{#if block.spans.length === 0}
				<div class="spacer" aria-hidden="true"></div>
			{:else}
				<p><RichText spans={block.spans} /></p>
			{/if}
		{:else if block.type === 'heading'}
			{#if block.level === 2}
				<h2 id={block.id}>{block.text}</h2>
			{:else if block.level === 3}
				<h3 id={block.id}>{block.text}</h3>
			{:else}
				<h4 id={block.id}>{block.text}</h4>
			{/if}
		{:else if block.type === 'quote'}
			<blockquote><RichText spans={block.spans} /></blockquote>
		{:else if block.type === 'code'}
			<pre><code>{block.text}</code></pre>
		{:else if block.type === 'divider'}
			<hr />
		{:else if block.type === 'list'}
			{#if block.ordered}
				<ol>
					{#each block.items as item, itemIndex (`n-${index}-${itemIndex}`)}
						<li><RichText spans={item} /></li>
					{/each}
				</ol>
			{:else}
				<ul>
					{#each block.items as item, itemIndex (`b-${index}-${itemIndex}`)}
						<li><RichText spans={item} /></li>
					{/each}
				</ul>
			{/if}
		{:else if block.type === 'image'}
			<figure>
				<img src={block.src} alt={block.alt} loading="lazy" referrerpolicy="no-referrer" />
				{#if block.alt !== 'Article image'}
					<figcaption>{block.alt}</figcaption>
				{/if}
			</figure>
		{:else}
			<p class="unsupported">Unsupported block: {block.name}</p>
		{/if}
	{/each}
</div>

<style>
	.article-body {
		max-inline-size: 42rem;
		font-family: var(--font-family-ibm);
		font-size: 1.05rem;
		line-height: 1.7;
		color: var(--text);
	}

	.article-body :global(p),
	.article-body :global(li),
	blockquote {
		margin-block: 0 1rem;
	}

	.article-body :global(a) {
		color: var(--neon);
	}

	.article-body :global(code) {
		font-family: ui-monospace, monospace;
		font-size: 0.92em;
	}

	h2,
	h3,
	h4 {
		margin-block: 1.6rem 0.6rem;
		line-height: 1.25;
	}

	pre {
		overflow-x: auto;
		margin-block: 0 1rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--border-muted);
		background: var(--panel);
	}

	blockquote {
		margin-inline: 0;
		padding-inline-start: 1rem;
		border-inline-start: 2px solid var(--neon);
		color: var(--text-secondary);
	}

	ul,
	ol {
		padding-inline-start: 1.25rem;
	}

	img {
		display: block;
		max-inline-size: 100%;
		height: auto;
	}

	figcaption,
	.unsupported {
		color: var(--text-muted);
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
	}

	.spacer {
		block-size: 0.75rem;
	}

	hr {
		margin-block: 1.5rem;
		border: 0;
		border-block-start: 1px solid var(--border-muted);
	}
</style>
