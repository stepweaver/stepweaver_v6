<script lang="ts">
	import Navbar from '$lib/components/site/Navbar.svelte';
	import Footer from '$lib/components/site/Footer.svelte';

	let { children } = $props();
</script>

<div class="bg-canvas text-text min-h-screen">
	<Navbar />

	<main>
		{@render children()}
	</main>

	<Footer />
</div>
