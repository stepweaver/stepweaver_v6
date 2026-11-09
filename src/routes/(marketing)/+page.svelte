<script lang="ts">
	import OperatorCard from '$lib/components/home/OperatorCard.svelte';
	import ActionLink from '$lib/components/ui/ActionLink.svelte';
	import {
		AGENT_OWNERSHIP_NOTE,
		HOMEPAGE_CHAPTER_NOTE,
		HOMEPAGE_EXPERIENCE,
		HOW_I_WORK,
		identity,
		WHAT_I_DO
	} from '$lib/data/identity';
</script>

<svelte:head>
	<title>{identity.name} | {identity.title}</title>
	<meta name="description" content={identity.positioning.short} />
</svelte:head>

<section class="hero">
	<div class="hero-copy">
		<p class="eyebrow">{identity.positioning.eyebrow}</p>
		<h1>
			{identity.positioning.headline}
			<span>{identity.positioning.headlineAccent}</span>
		</h1>
		<p class="lede">{identity.positioning.lede}</p>
		<p class="support">{identity.supportingLine}</p>
		<div class="actions">
			<ActionLink
				href={identity.links.contactConsult}
				label="Let's talk about your system"
				variant="primary"
			/>
			<ActionLink href="/writing" label="Writing" />
			<ActionLink href={identity.links.about} label="About" />
		</div>
	</div>
	<div class="hero-card">
		<OperatorCard />
	</div>
</section>

<section class="band" aria-labelledby="what-i-do">
	<p class="eyebrow">What I do</p>
	<h2 id="what-i-do">The work is the system, not a catalog of projects.</h2>
	<div class="grid">
		{#each WHAT_I_DO as item (item.title)}
			<article>
				<h3>{item.title}</h3>
				<p>{item.body}</p>
			</article>
		{/each}
	</div>
</section>

<section class="band" aria-labelledby="how-i-work">
	<p class="eyebrow">How I work</p>
	<h2 id="how-i-work">Understand the workflow, then make it operable.</h2>
	<ol class="grid">
		{#each HOW_I_WORK as step (step.step)}
			<li>
				<p class="eyebrow">{step.step}</p>
				<h3>{step.title}</h3>
				<p>{step.body}</p>
			</li>
		{/each}
	</ol>
	<p>{AGENT_OWNERSHIP_NOTE}</p>
</section>

<section class="band" aria-labelledby="background">
	<p class="eyebrow">Background</p>
	<h2 id="background">The chronology matches the résumé.</h2>
	<div class="grid">
		{#each HOMEPAGE_EXPERIENCE as role (`${role.org}-${role.role}`)}
			<article>
				<h3>{role.role} · {role.org}</h3>
				<p class="eyebrow">{role.when}</p>
				<p>{role.body}</p>
			</article>
		{/each}
	</div>
	<p>{HOMEPAGE_CHAPTER_NOTE}</p>
	<p>{identity.philosophy.body}</p>
</section>

<section class="band" aria-labelledby="writing">
	<p class="eyebrow">Recent writing</p>
	<h2 id="writing">Writing will live here.</h2>
	<p>
		Notion is still the CMS. This build does not fetch it yet, so no posts are shown. The empty
		state is tracked as Milestone 2 in docs/MIGRATION.md.
	</p>
	<p><a href="/writing">Writing status</a></p>
</section>

<section class="band" aria-labelledby="conversation">
	<p class="eyebrow">Conversation</p>
	<h2 id="conversation">Tell me about the system.</h2>
	<p>
		The contact form does not deliver mail in this build. The contact page shows the address and
		keeps the fields that were already here.
	</p>
	<div class="actions">
		<ActionLink
			href={identity.links.contactConsult}
			label="Let's talk about your system"
			variant="primary"
		/>
		<ActionLink href={identity.links.resume} label="Resume" />
	</div>
	<p class="quiet">
		Terminal and Lab are not rebuilt here.
		<a href="/terminal">Terminal status</a>
		·
		<a href="/lab">Lab status</a>
	</p>
</section>

<style>
	.hero,
	.band {
		max-inline-size: var(--content-width-wide);
		margin-inline: auto;
		padding-inline: var(--space-lg);
	}

	.hero {
		display: grid;
		gap: var(--space-lg);
		padding-block: var(--space-md) var(--space-xl);
	}

	.hero-copy span {
		display: block;
		color: var(--neon);
	}

	h1 {
		font-size: clamp(2.25rem, 1.4rem + 4vw, 3.75rem);
		line-height: var(--line-height-tight);
	}

	h2 {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-snug);
		margin-block-end: var(--space-md);
	}

	h3 {
		margin-block-end: var(--space-sm);
	}

	.lede,
	.support,
	.band p {
		max-inline-size: 46rem;
		color: var(--text-secondary);
		line-height: var(--line-height-relaxed);
	}

	.eyebrow,
	.quiet {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
		color: var(--neon);
	}

	.support,
	.quiet {
		margin-block-start: var(--space-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-block-start: var(--space-lg);
	}

	.band {
		padding-block: var(--space-xl);
		border-block-start: 1px solid var(--border-muted);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-md);
		margin-block: var(--space-lg);
	}

	article,
	li {
		border: 1px solid var(--border-muted);
		background: var(--panel);
		padding: var(--space-md);
	}

	a {
		color: var(--neon);
	}

	@media (width >= 64rem) {
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
