<script lang="ts">
	import { page } from '$app/state';
	import PageMeta from '$lib/components/seo/PageMeta.svelte';
	import { resolvePageMetadata } from '$lib/seo/metadata';
	import '../app.css';

	let { children } = $props();

	const meta = $derived(
		resolvePageMetadata({
			pathname: page.url.pathname,
			status: page.status,
			message: typeof page.error?.message === 'string' ? page.error.message : undefined,
			data: page.data
		})
	);
</script>

<PageMeta {meta} />

{@render children()}
