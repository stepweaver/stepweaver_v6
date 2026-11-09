<script lang="ts">
	import type { Snippet } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import CommandPalette from '#lib/components/site/CommandPalette.svelte';
	import SiteFooter from '#lib/components/site/SiteFooter.svelte';
	import SiteHeader from '#lib/components/site/SiteHeader.svelte';
	import { buildStructuredData, jsonLdScript } from '#lib/seo/site.ts';
	import '../app.css';

	let { children }: { children: Snippet } = $props();
	const structured = buildStructuredData();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="Stephen Weaver, Business Systems Developer and Systems Integration Consultant."
	/>
	<!-- eslint-disable svelte/no-at-html-tags -- local JSON-LD, angle brackets escaped -->
	{@html jsonLdScript(structured.person)}
	{@html jsonLdScript(structured.website)}
	<!-- eslint-enable svelte/no-at-html-tags -->
</svelte:head>

<a class="skip-link" href="#main">Skip to main content</a>
<div class="site-shell">
	<SiteHeader />
	<main id="main" class="site-main">
		{@render children()}
	</main>
	<SiteFooter />
</div>
<CommandPalette />
