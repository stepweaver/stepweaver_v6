<script lang="ts">
	import Navbar from '$lib/components/site/Navbar.svelte';
	import Footer from '$lib/components/site/Footer.svelte';

	let { children } = $props();
</script>

<div class="site-shell">
	<Navbar />

	<main>
		{@render children()}
	</main>

	<Footer />
</div>

<style>
	.site-shell {
		min-block-size: 100vh;
		min-block-size: 100dvb;
		background: var(--canvas);
		color: var(--text);
	}
</style>
