<script lang="ts">
	import Navbar from '$lib/components/site/Navbar.svelte';
	import Footer from '$lib/components/site/Footer.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-canvas text-text">
	<Navbar />

	<main>
		{@render children()}
	</main>

	<Footer />
</div>