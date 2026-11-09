<script lang="ts">
	import { onMount } from 'svelte';
	import { CONTACT, OPERATOR_CHAPTER, OPERATOR_TAGS, PRIMARY_TITLE } from '#lib/data/identity.ts';
	import { currentTheme } from '#lib/theme/apply-theme.ts';
	import type { ThemeId } from '#lib/theme/themes.ts';

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
			<h2 class="card-name">Stephen Weaver</h2>
		</div>
		<div>
			<p class="meta">Profile ID</p>
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
			<p>{PRIMARY_TITLE}</p>
			<p class="label">Availability</p>
			<a class="availability" href="/resume">
				Open to work
				<span class="availability-dot" aria-hidden="true"></span>
			</a>
			<p class="meta">{CONTACT.location}</p>
		</div>
	</div>

	<div class="card-block">
		<p class="label">Current chapter</p>
		<p>{OPERATOR_CHAPTER}</p>
	</div>

	<p class="card-block">
		I turn business workflows into dependable software, automation, and AI-assisted systems. I
		define what should exist, connect the moving parts, supervise implementation, and think through
		failure points before they become expensive.
	</p>

	<div class="button-row card-block">
		<a class="mini-button primary" href="/contact?intent=consult">Let's talk</a>
		<a class="mini-button" href="/writing">Writing</a>
		<a class="mini-button" href="/about">About</a>
		<a class="mini-button" href="/resume">Resume</a>
	</div>

	<div class="tag-row card-block">
		{#each OPERATOR_TAGS as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</div>

	<div class="matrix-link">
		<p class="label">Matrix link // status // <span class="danger">unplugged</span></p>
		<p class="meta">Link dormant. The animated matrix sequence is not ported.</p>
		<div class="matrix-cells" aria-hidden="true">
			{#each ['λ', '·', '·', '·', '·', '·'] as cell, index (index)}
				<span>{cell}</span>
			{/each}
		</div>
	</div>
</section>

<style>
	.danger {
		color: rgb(var(--danger));
	}

	.card-top p,
	.portrait-row p,
	.card-block p {
		margin-bottom: 0.35rem;
	}
</style>
