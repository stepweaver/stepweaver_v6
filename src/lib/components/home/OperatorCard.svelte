<script lang="ts">
	import { onMount } from 'svelte';
	import { identity, OPERATOR_CHAPTER, OPERATOR_TAGS } from '$lib/data/identity';
	import { currentTheme } from '$lib/theme/apply-theme';
	import type { ThemeId } from '$lib/theme/themes';

	let theme = $state<ThemeId>('dark');
	let glitch = $state(false);
	let skipGlitch = true;
	const skynet = $derived(theme === 'skynet');

	onMount(() => {
		const sync = () => {
			theme = currentTheme();
		};
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
		return () => observer.disconnect();
	});

	$effect(() => {
		const appearance = theme;
		if (skipGlitch) {
			skipGlitch = false;
			return;
		}
		if (!appearance || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		glitch = true;
		const timer = window.setTimeout(() => {
			glitch = false;
		}, 480);
		return () => window.clearTimeout(timer);
	});
</script>

<section class="operator-card" aria-label="Operator profile">
	<span class="corner tl"></span>
	<span class="corner tr"></span>
	<span class="corner bl"></span>
	<span class="corner br"></span>

	<header class="card-top">
		<div>
			<p class="label">Profile</p>
			<h2>Stephen Weaver</h2>
		</div>
		<div>
			<p class="label">Profile ID</p>
			<p>HMFIC-01</p>
		</div>
	</header>

	<div class="portrait-row">
		<div class="portrait-bay" class:glitch>
			<img
				src="/images/pixarMe-256.png"
				alt={skynet ? '' : 'Stephen Weaver'}
				style:opacity={skynet ? 0 : 1}
			/>
			<img src="/images/pixarMe_terminator.png" alt="" style:opacity={skynet ? 1 : 0} />
		</div>
		<div>
			<p class="label">Role</p>
			<p>{identity.title}</p>
			<p class="label">Availability</p>
			<a href="/resume">Open to work</a>
			<p class="meta">{identity.location}</p>
		</div>
	</div>

	<div>
		<p class="label">Current chapter</p>
		<p>{OPERATOR_CHAPTER}</p>
	</div>

	<p>
		I turn business workflows into dependable software, automation, and AI-assisted systems. I
		define what should exist, connect the moving parts, supervise implementation, and think through
		failure points before they become expensive.
	</p>

	<div class="actions">
		<a href="/contact?intent=consult">Let's talk</a>
		<a href="/writing">Writing</a>
		<a href="/about">About</a>
		<a href="/resume">Resume</a>
	</div>

	<ul class="tags">
		{#each OPERATOR_TAGS as tag (tag)}
			<li>{tag}</li>
		{/each}
	</ul>

	<div class="matrix">
		<p class="label">Matrix link // status // unplugged</p>
		<p class="meta">Link dormant. The animated matrix sequence is not ported.</p>
	</div>
</section>

<style>
	.operator-card {
		position: relative;
		display: grid;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: color-mix(in srgb, var(--panel) 88%, transparent);
		border: 1px solid var(--border-muted);
		color: var(--text);
	}

	.corner {
		position: absolute;
		inline-size: 0.7rem;
		block-size: 0.7rem;
		border-color: var(--neon);
		border-style: solid;
	}

	.tl {
		inset-block-start: 0.4rem;
		inset-inline-start: 0.4rem;
		border-width: 1px 0 0 1px;
	}

	.tr {
		inset-block-start: 0.4rem;
		inset-inline-end: 0.4rem;
		border-width: 1px 1px 0 0;
	}

	.bl {
		inset-block-end: 0.4rem;
		inset-inline-start: 0.4rem;
		border-width: 0 0 1px 1px;
	}

	.br {
		inset-block-end: 0.4rem;
		inset-inline-end: 0.4rem;
		border-width: 0 1px 1px 0;
	}

	.card-top,
	.portrait-row,
	.actions,
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
	}

	.portrait-row {
		flex-wrap: nowrap;
		align-items: flex-start;
	}

	.card-top {
		justify-content: space-between;
	}

	h2,
	p,
	a,
	li {
		font-family: var(--font-family-ibm);
	}

	.label,
	.meta {
		font-family: var(--font-family-ocr);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.label {
		color: var(--text-label);
	}

	.meta {
		color: var(--text-meta);
	}

	.portrait-bay {
		position: relative;
		inline-size: 7rem;
		block-size: 7rem;
	}

	img {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		object-fit: cover;
		border: 1px solid var(--border-muted);
	}

	.glitch img {
		animation: glitch 480ms steps(2, end);
	}

	.actions a,
	.tags li {
		border: 1px solid var(--border-muted);
		padding: 0.35rem 0.6rem;
		font-size: var(--font-size-xs);
	}

	.actions a:first-child {
		border-color: var(--neon);
		color: var(--neon);
	}

	@keyframes glitch {
		50% {
			transform: translateX(1px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glitch img {
			animation: none;
		}
	}
</style>
