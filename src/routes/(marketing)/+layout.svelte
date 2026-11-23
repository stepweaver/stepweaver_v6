<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import SignatureBackground from '$lib/components/effects/SignatureBackground.svelte';
	import CommandPalette from '$lib/components/site/CommandPalette.svelte';
	import Footer from '$lib/components/site/Footer.svelte';
	import LambdaChat from '$lib/components/site/LambdaChat.svelte';
	import Navbar from '$lib/components/site/Navbar.svelte';
	import { jsonLdScript } from '$lib/seo/json-ld';

	let { children } = $props();
	const structured = $derived(page.data.structuredData);
	const consoleRoute = $derived(page.url.pathname === '/terminal');

	let main: HTMLElement | undefined;
	let pageFade: Animation | undefined;

	afterNavigate(({ from, to, type }) => {
		pageFade?.cancel();

		if (
			!main ||
			!from ||
			!to ||
			type === 'popstate' ||
			from.url.pathname === to.url.pathname ||
			from.route.id === '/(marketing)/terminal' ||
			to.route.id === '/(marketing)/terminal' ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return;
		}

		pageFade = main.animate([{ opacity: 0.6 }, { opacity: 1 }], {
			duration: 220,
			easing: 'ease-out'
		});
	});
</script>

<svelte:head>
	{#if structured}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdScript(structured)}
	{/if}
</svelte:head>

<div class="site-shell" class:console-route={consoleRoute}>
	<SignatureBackground />
	<a class="skip-link" href="#main">Skip to main content</a>
	<Navbar />

	<main id="main" bind:this={main}>
		{@render children()}
	</main>

	{#if !consoleRoute}
		<Footer />
		<LambdaChat />
	{/if}
	<CommandPalette />
</div>

<style>
	.site-shell {
		position: relative;
		z-index: 0;
		isolation: isolate;
		min-block-size: 100vh;
		min-block-size: 100dvb;
		background: var(--canvas);
		color: var(--text);
	}

	@media (width < 40rem) {
		main {
			--page-top-space: var(--space-md);
		}
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

	.site-shell.console-route {
		display: flex;
		flex-direction: column;
		block-size: var(--console-viewport-height, 100dvb);
		min-block-size: 0;
		overflow: hidden;
	}

	.site-shell.console-route main {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		min-block-size: 0;
	}

	.console-route :global(.palette-trigger) {
		display: none;
	}
</style>
