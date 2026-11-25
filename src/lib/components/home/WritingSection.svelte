<script lang="ts">
	import LambdaText from '$lib/components/site/LambdaText.svelte';
	import { coverImageSrc } from '$lib/writing/rich-text';
	import type { HomeWritingCard, HomeWritingView } from '$lib/writing/entries';

	let { writing, pending = false }: { writing: HomeWritingView; pending?: boolean } = $props();

	const leadCover = $derived(coverImageSrc(writing.lead?.cover));

	function cardCover(card: HomeWritingCard) {
		return coverImageSrc(card.cover);
	}
</script>

{#if writing.status === 'unavailable'}
	<section class="writing-home" aria-labelledby="home-writing-heading">
		<header class="writing-head">
			<p id="home-writing-heading" class="kicker">Writing</p>
			<a class="more" href="/writing">View all writing</a>
		</header>
		<p class="notice" role="status">
			{pending
				? 'Loading recent writing…'
				: 'Writing is temporarily unavailable. This is not an empty archive.'}
		</p>
	</section>
{:else if writing.lead}
	<section class="writing-home" aria-labelledby="home-writing-heading">
		<header class="writing-head">
			<p id="home-writing-heading" class="kicker">Writing</p>
			<a class="more" href="/writing">View all writing</a>
		</header>

		<a class="lead" class:has-photo={Boolean(leadCover)} href={`/writing/${writing.lead.slug}`}>
			{#if leadCover}
				<figure class="photo">
					<img src={leadCover} alt="" loading="lazy" referrerpolicy="no-referrer" />
				</figure>
			{/if}
			<div class="copy">
				<h2><LambdaText text={writing.lead.title} /></h2>
				{#if writing.lead.summary}
					<p class="summary">{writing.lead.summary}</p>
				{/if}
			</div>
		</a>

		{#if writing.recent.length > 0}
			<ul class="recent">
				{#each writing.recent as post (post.slug)}
					{@const cover = cardCover(post)}
					<li>
						<a class="card" class:has-photo={Boolean(cover)} href={`/writing/${post.slug}`}>
							{#if cover}
								<figure class="photo">
									<img src={cover} alt="" loading="lazy" referrerpolicy="no-referrer" />
								</figure>
							{/if}
							<div class="copy">
								<h3><LambdaText text={post.title} /></h3>
								{#if post.summary}
									<p class="summary">{post.summary}</p>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style>
	.writing-home {
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
		padding: 0 var(--space-lg) var(--space-2xl);
	}

	.writing-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-block-end: var(--space-md);
	}

	.kicker,
	.more {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.kicker {
		color: var(--neon);
	}

	.more {
		color: var(--text);
	}

	.more:hover,
	.lead:hover h2,
	.card:hover h3 {
		color: var(--neon);
	}

	.lead,
	.card {
		display: block;
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		background: var(--surface);
		color: var(--text);
	}

	.lead.has-photo,
	.card.has-photo {
		padding: 0;
	}

	.copy {
		padding: var(--space-md);
	}

	.photo {
		position: relative;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		background: color-mix(in oklab, var(--border) 18%, var(--canvas));
	}

	.recent .photo {
		aspect-ratio: 3 / 2;
	}

	.photo img {
		position: absolute;
		inset: 0;
		display: block;
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
	}

	h2,
	h3 {
		overflow-wrap: break-word;
		line-height: var(--line-height-tight);
	}

	h2 {
		font-size: clamp(1.35rem, 1rem + 1.6vw, 1.75rem);
	}

	h3 {
		font-size: var(--font-size-lg);
		line-height: var(--line-height-snug);
	}

	.summary {
		display: -webkit-box;
		margin-block-start: var(--space-sm);
		overflow: hidden;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-body);
		overflow-wrap: break-word;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
	}

	.recent .summary {
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.recent {
		display: grid;
		gap: var(--space-md);
		margin-block-start: var(--space-md);
	}

	.card {
		block-size: 100%;
	}

	.notice {
		border: 1px solid color-mix(in oklab, var(--border) 30%, transparent);
		padding: var(--space-md);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-body);
	}

	@media (width >= 64rem) {
		.lead.has-photo {
			display: grid;
			grid-template-columns: minmax(0, 1.5fr) minmax(16rem, 1fr);
			align-items: stretch;
		}

		.lead.has-photo .copy {
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			padding: var(--space-lg);
		}

		.lead h2 {
			font-size: clamp(1.75rem, 1.2rem + 1.5vw, 2.5rem);
		}

		.recent {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
