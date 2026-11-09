<script lang="ts">
	import { page } from '$app/state';
	import CommandPalette from '$lib/components/site/CommandPalette.svelte';
	import Footer from '$lib/components/site/Footer.svelte';
	import Navbar from '$lib/components/site/Navbar.svelte';
	import { jsonLdScript } from '$lib/seo/json-ld';

	let { children } = $props();
	const structured = $derived(page.data.structuredData);
</script>

<svelte:head>
	{#if structured}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(structured)}
	{/if}
</svelte:head>

<div class="site-shell">
	<a class="skip-link" href="#main">Skip to main content</a>
	<Navbar />

	<main id="main">
		{@render children()}
	</main>

	<Footer />
	<CommandPalette />
</div>

<style>
	.site-shell {
		min-block-size: 100vh;
		min-block-size: 100dvb;
		background: var(--canvas);
		color: var(--text);
	}

	.skip-link {
		position: absolute;
		inset-inline-start: var(--space-md);
		inset-block-start: var(--space-md);
		z-index: 40;
		transform: translateY(-200%);
		background: var(--surface);
		color: var(--text);
		padding: 0.4rem 0.6rem;
	}

	.skip-link:focus {
		transform: none;
	}
</style>
