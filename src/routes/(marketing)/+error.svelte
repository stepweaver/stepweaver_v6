<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-page">
	<p class="eyebrow">// UNAVAILABLE</p>
	<h1>{page.error?.message ?? 'This page is not available.'}</h1>
</div>

<style>
	.error-page {
		max-inline-size: var(--content-width-narrow);
		margin-inline: auto;
		padding: var(--space-3xl) var(--space-lg);
	}

	.eyebrow {
		font-family: var(--font-family-ocr);
		color: var(--neon);
		letter-spacing: var(--letter-spacing-wide);
		margin-block-end: var(--space-sm);
	}
</style>
