<script lang="ts">
	import StatusPage from '$lib/components/site/StatusPage.svelte';
</script>

<StatusPage
	kicker="// WRITING"
	title="Writing is not connected yet."
	body="Notion remains the CMS. This SvelteKit app does not query it, cache it, or render posts."
	points={[
		'No posts are listed, including posts that are live on the production site.',
		'Stable slugs and legacy redirects are Milestone 2.',
		'The production writing pages still run at stepweaver.dev/writing.'
	]}
/>
